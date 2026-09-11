using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Api.Models;
using NovaMart.Api.Repositories;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IDataStore _dataStore;

    public OrdersController(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders([FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");

        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) && string.IsNullOrEmpty(email))
        {
            var all = await _dataStore.GetAllOrdersAsync();
            return Ok(all);
        }

        if (string.IsNullOrWhiteSpace(userEmail))
        {
            // For guest checkout viewing or demo, if no email provided and not admin, return all or empty
            var all = await _dataStore.GetAllOrdersAsync();
            return Ok(all);
        }

        var orders = await _dataStore.GetCustomerOrdersAsync(userEmail.Trim().ToLowerInvariant());
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetById(string id)
    {
        var order = await _dataStore.GetOrderByIdAsync(id);
        if (order == null)
            return NotFound(new { message = $"Order with ID '{id}' not found." });

        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder([FromBody] CreateOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
            return BadRequest(new { message = "Order must contain at least one item." });

        if (string.IsNullOrWhiteSpace(req.Customer) || string.IsNullOrWhiteSpace(req.Address))
            return BadRequest(new { message = "Customer name and delivery address are required." });

        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? req.Email;
        if (string.IsNullOrWhiteSpace(userEmail))
            userEmail = "guest@novamart.in";

        decimal subtotal = 0;
        foreach (var it in req.Items)
        {
            subtotal += it.Price * it.Qty;
        }

        // Apply coupon if provided
        decimal discount = 0;
        if (!string.IsNullOrWhiteSpace(req.CouponCode))
        {
            var coupon = await _dataStore.GetCouponByCodeAsync(req.CouponCode.Trim().ToUpperInvariant());
            if (coupon != null && subtotal >= coupon.MinCart)
            {
                if (coupon.DiscountPercent.HasValue)
                {
                    discount = Math.Round(subtotal * (coupon.DiscountPercent.Value / 100m), 2);
                }
                else if (coupon.DiscountFlat.HasValue)
                {
                    discount = Math.Min(coupon.DiscountFlat.Value, subtotal);
                }
            }
        }

        decimal deliveryFee = 0;
        if (req.DeliverySpeed.Contains("Express", StringComparison.OrdinalIgnoreCase))
            deliveryFee = 99;
        else if (req.DeliverySpeed.Contains("Same-Day", StringComparison.OrdinalIgnoreCase))
            deliveryFee = 149;
        else
            deliveryFee = subtotal >= 499 ? 0 : 40;

        decimal tax = Math.Round((subtotal - discount) * 0.05m, 2);
        if (tax < 0) tax = 0;

        decimal total = (subtotal - discount) + deliveryFee + tax;

        var orderId = "NM-2026-" + new Random().Next(1000, 9999);
        var trackingId = "TRK-IND-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

        var order = new Order
        {
            Id = orderId,
            Date = DateTime.UtcNow.ToString("dd MMM yyyy"),
            Customer = req.Customer.Trim(),
            Email = userEmail.Trim().ToLowerInvariant(),
            Phone = req.Phone?.Trim() ?? string.Empty,
            Address = req.Address.Trim(),
            Status = "Placed",
            TrackingId = trackingId,
            DeliverySpeed = req.DeliverySpeed,
            Subtotal = subtotal,
            Discount = discount,
            DeliveryFee = deliveryFee,
            Tax = tax,
            Total = total,
            Items = req.Items,
            PaymentMethod = string.IsNullOrWhiteSpace(req.PaymentMethod) ? "UPI" : req.PaymentMethod
        };

        var created = await _dataStore.CreateOrderAsync(order);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateStatus(string id, [FromBody] UpdateOrderStatusRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Status))
            return BadRequest(new { message = "Status is required." });

        var validStatuses = new[] { "Placed", "Confirmed", "Shipped", "Delivered", "Cancelled" };
        if (!validStatuses.Contains(req.Status, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = $"Invalid status. Allowed values: {string.Join(", ", validStatuses)}" });

        var updated = await _dataStore.UpdateOrderStatusAsync(id, req.Status, req.TrackingId);
        if (!updated)
            return NotFound(new { message = $"Order with ID '{id}' not found." });

        return Ok(new { message = $"Order status updated to '{req.Status}'.", orderId = id, status = req.Status });
    }
}

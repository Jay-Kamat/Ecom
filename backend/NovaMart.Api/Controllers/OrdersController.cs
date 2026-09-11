using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Application.Features.Orders.Commands;
using NovaMart.Application.Features.Orders.Queries;
using NovaMart.Domain.Entities;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ISender _mediator;

    public OrdersController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders([FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");
        var isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);

        var orders = await _mediator.Send(new GetOrdersQuery(userEmail, isAdmin));
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetById(string id)
    {
        var order = await _mediator.Send(new GetOrderByIdQuery(id));
        if (order == null)
            return NotFound(new { message = $"Order with ID '{id}' not found." });

        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder([FromBody] CreateOrderDto req)
    {
        if (req.Items == null || req.Items.Count == 0)
            return BadRequest(new { message = "Order must contain at least one item." });

        if (string.IsNullOrWhiteSpace(req.Customer) || string.IsNullOrWhiteSpace(req.Address))
            return BadRequest(new { message = "Customer name and delivery address are required." });

        var userEmail = User.FindFirstValue(ClaimTypes.Email);
        var created = await _mediator.Send(new CreateOrderCommand(req, userEmail));

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    public record UpdateOrderStatusDto(string Status, string? TrackingId = null);

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateStatus(string id, [FromBody] UpdateOrderStatusDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Status))
            return BadRequest(new { message = "Status is required." });

        var validStatuses = new[] { "Placed", "Confirmed", "Shipped", "Delivered", "Cancelled" };
        if (!validStatuses.Contains(req.Status, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = $"Invalid status. Allowed values: {string.Join(", ", validStatuses)}" });

        var success = await _mediator.Send(new UpdateOrderStatusCommand(id, req.Status, req.TrackingId));
        if (!success)
            return NotFound(new { message = $"Order with ID '{id}' not found." });

        return Ok(new { message = $"Order status updated to '{req.Status}'.", orderId = id, status = req.Status });
    }
}

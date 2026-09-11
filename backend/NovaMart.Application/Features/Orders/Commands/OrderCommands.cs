using MediatR;
using Microsoft.EntityFrameworkCore;
using NovaMart.Application.Common.Interfaces;
using NovaMart.Domain.Entities;

namespace NovaMart.Application.Features.Orders.Commands;

public record CreateOrderDto(
    string Customer,
    string Email,
    string Phone,
    string Address,
    string DeliverySpeed,
    string PaymentMethod,
    string? CouponCode,
    List<OrderItem> Items
);

public record CreateOrderCommand(CreateOrderDto Dto, string? AuthenticatedEmail) : IRequest<Order>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Order>
{
    private readonly IApplicationDbContext _context;

    public CreateOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Order> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var email = !string.IsNullOrWhiteSpace(request.AuthenticatedEmail)
            ? request.AuthenticatedEmail.Trim().ToLowerInvariant()
            : (!string.IsNullOrWhiteSpace(dto.Email) ? dto.Email.Trim().ToLowerInvariant() : "guest@novamart.in");

        decimal subtotal = 0;
        foreach (var item in dto.Items)
        {
            subtotal += item.Price * item.Qty;
        }

        // Validate coupon if supplied
        decimal discount = 0;
        if (!string.IsNullOrWhiteSpace(dto.CouponCode))
        {
            var code = dto.CouponCode.Trim().ToUpperInvariant();
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code, cancellationToken);
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
                coupon.UsageCount++;
            }
        }

        decimal deliveryFee = 0;
        if (dto.DeliverySpeed.Contains("Express", StringComparison.OrdinalIgnoreCase))
            deliveryFee = 99;
        else if (dto.DeliverySpeed.Contains("Same-Day", StringComparison.OrdinalIgnoreCase))
            deliveryFee = 149;
        else
            deliveryFee = subtotal >= 499 ? 0 : 40;

        decimal tax = Math.Round((subtotal - discount) * 0.05m, 2);
        if (tax < 0) tax = 0;

        decimal total = (subtotal - discount) + deliveryFee + tax;

        var orderId = "NM-2026-" + Random.Shared.Next(1000, 9999);
        var trackingId = "TRK-IND-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

        var order = new Order
        {
            Id = orderId,
            Date = DateTime.UtcNow.ToString("dd MMM yyyy"),
            Customer = dto.Customer.Trim(),
            Email = email,
            Phone = dto.Phone?.Trim() ?? string.Empty,
            Address = dto.Address.Trim(),
            Status = "Placed",
            TrackingId = trackingId,
            DeliverySpeed = string.IsNullOrWhiteSpace(dto.DeliverySpeed) ? "Standard Free" : dto.DeliverySpeed,
            Subtotal = subtotal,
            Discount = discount,
            DeliveryFee = deliveryFee,
            Tax = tax,
            Total = total,
            Items = dto.Items,
            PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "UPI" : dto.PaymentMethod
        };

        _context.Orders.Add(order);

        // Update user order count if exists
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user != null)
        {
            user.OrdersCount++;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return order;
    }
}

public record UpdateOrderStatusCommand(string OrderId, string Status, string? TrackingId) : IRequest<bool>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateOrderStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);
        if (order == null) return false;

        order.Status = request.Status;
        if (!string.IsNullOrWhiteSpace(request.TrackingId))
        {
            order.TrackingId = request.TrackingId.Trim();
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

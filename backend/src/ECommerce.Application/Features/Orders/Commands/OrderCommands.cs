using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Enums;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Orders.Commands;

public record CreateOrderCommand(CreateOrderDto OrderDto) : IRequest<Result<OrderDto>>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDto>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var dto = request.OrderDto;

        // Resolve or create Customer
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email.ToLower() == dto.Email.ToLower(), cancellationToken);
        if (customer == null)
        {
            var names = dto.Customer.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            customer = new Customer
            {
                FirstName = names.Length > 0 ? names[0] : dto.Customer,
                LastName = names.Length > 1 ? names[1] : string.Empty,
                Email = dto.Email,
                Phone = dto.Phone
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Create Shipping Address
        var shippingAddress = new ShippingAddress
        {
            FullName = dto.Customer,
            Phone = dto.Phone,
            Street = dto.Address,
            City = "Bengaluru",
            State = "Karnataka",
            PostalCode = "560001",
            Country = "India"
        };
        _context.ShippingAddresses.Add(shippingAddress);

        // Calculate Totals
        decimal subtotal = dto.Items.Sum(i => i.Price * i.Qty);
        decimal discount = 0m;

        if (!string.IsNullOrWhiteSpace(dto.CouponCode))
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code.ToUpper() == dto.CouponCode.ToUpper() && c.IsActive, cancellationToken);
            if (coupon != null && subtotal >= coupon.MinimumPurchase)
            {
                discount = coupon.DiscountAmount;
                coupon.UsageCount++;
            }
        }

        decimal deliveryFee = dto.DeliverySpeed.Contains("Express", StringComparison.OrdinalIgnoreCase) ? 99m : 0m;
        decimal tax = Math.Round((subtotal - discount) * 0.18m, 2);
        decimal total = Math.Max(0, subtotal - discount + deliveryFee + tax);

        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        var trackingId = $"TRK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerId = customer.Id,
            Customer = customer,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Placed,
            Subtotal = subtotal,
            DiscountAmount = discount,
            DeliveryFee = deliveryFee,
            TaxAmount = tax,
            TotalAmount = total,
            CouponCode = dto.CouponCode,
            TrackingNumber = trackingId,
            ShippingAddress = shippingAddress,
            PaymentMethod = PaymentMethod.UPI,
            PaymentStatus = PaymentStatus.Pending
        };

        // Add items
        foreach (var item in dto.Items)
        {
            Guid.TryParse(item.ProductId, out var prodId);
            order.Items.Add(new OrderItem
            {
                ProductId = prodId,
                ProductName = item.Title,
                ProductSKU = item.ProductId,
                ImageUrl = item.Img,
                Quantity = item.Qty,
                UnitPrice = item.Price,
                TotalPrice = item.Price * item.Qty
            });
        }

        // Add initial status history
        order.StatusHistory.Add(new OrderStatusHistory
        {
            Status = OrderStatus.Placed,
            Note = "Order placed successfully by customer",
            CreatedAt = DateTime.UtcNow
        });

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Date = order.OrderDate.ToString("dd MMM yyyy"),
            Customer = customer.FirstName + " " + customer.LastName,
            Email = customer.Email,
            Phone = customer.Phone ?? string.Empty,
            Address = shippingAddress.Street,
            Status = order.Status.ToString(),
            TrackingId = order.TrackingNumber,
            DeliverySpeed = dto.DeliverySpeed,
            Subtotal = order.Subtotal,
            Discount = order.DiscountAmount,
            DeliveryFee = order.DeliveryFee,
            Tax = order.TaxAmount,
            Total = order.TotalAmount,
            PaymentMethod = order.PaymentMethod.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                Title = i.ProductName,
                Qty = i.Quantity,
                Price = i.UnitPrice,
                Img = i.ImageUrl ?? string.Empty
            }).ToList()
        });
    }
}

public record CancelOrderCommand(Guid OrderId, string Reason, string? RequesterEmail = null, bool IsAdmin = false) : IRequest<Result>;

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public CancelOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            return Result.Failure(Error.NotFound("Order.NotFound", "Order not found"));

        // IDOR Protection: Non-admin users can only cancel their own orders
        if (!request.IsAdmin && !string.IsNullOrWhiteSpace(request.RequesterEmail))
        {
            if (!string.Equals(order.Customer.Email, request.RequesterEmail, StringComparison.OrdinalIgnoreCase))
            {
                return Result.Failure(Error.Forbidden("Order.Forbidden", "You do not have permission to cancel this order."));
            }
        }

        if (order.Status == OrderStatus.Delivered)
            return Result.Failure(Error.Conflict("Order.CannotCancel", "Delivered order cannot be cancelled."));

        order.Status = OrderStatus.Cancelled;
        order.StatusHistory.Add(new OrderStatusHistory
        {
            Status = OrderStatus.Cancelled,
            Note = $"Cancelled: {request.Reason}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record UpdateOrderStatusCommand(string OrderId, string Status, string? TrackingId, string? Note) : IRequest<Result<OrderDto>>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, Result<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateOrderStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDto>> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        Guid.TryParse(request.OrderId, out var orderGuid);

        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.ShippingAddress)
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == orderGuid || o.OrderNumber == request.OrderId, cancellationToken);

        if (order == null)
            return Result.Failure<OrderDto>(Error.NotFound("Order.NotFound", "Order not found"));

        if (Enum.TryParse<OrderStatus>(request.Status, true, out var parsedStatus))
        {
            order.Status = parsedStatus;
        }

        if (!string.IsNullOrWhiteSpace(request.TrackingId))
            order.TrackingNumber = request.TrackingId;

        order.StatusHistory.Add(new OrderStatusHistory
        {
            Status = order.Status,
            Note = request.Note ?? $"Status updated to {order.Status}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Date = order.OrderDate.ToString("dd MMM yyyy"),
            Customer = $"{order.Customer.FirstName} {order.Customer.LastName}".Trim(),
            Email = order.Customer.Email,
            Phone = order.Customer.Phone ?? string.Empty,
            Address = order.ShippingAddress.Street,
            Status = order.Status.ToString(),
            TrackingId = order.TrackingNumber ?? string.Empty,
            Subtotal = order.Subtotal,
            Discount = order.DiscountAmount,
            DeliveryFee = order.DeliveryFee,
            Tax = order.TaxAmount,
            Total = order.TotalAmount,
            PaymentMethod = order.PaymentMethod.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                Title = i.ProductName,
                Qty = i.Quantity,
                Price = i.UnitPrice,
                Img = i.ImageUrl ?? string.Empty
            }).ToList()
        });
    }
}

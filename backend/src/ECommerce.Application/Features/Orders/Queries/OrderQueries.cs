using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Orders.Queries;

public record GetOrdersQuery(string? Email = null) : IRequest<IReadOnlyList<OrderDto>>;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, IReadOnlyList<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<OrderDto>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.ShippingAddress)
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim().ToLower();
            query = query.Where(o => o.Customer.Email.ToLower() == email);
        }

        var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync(cancellationToken);

        return orders.Select(o => new OrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            Date = o.OrderDate.ToString("dd MMM yyyy"),
            Customer = $"{o.Customer.FirstName} {o.Customer.LastName}".Trim(),
            Email = o.Customer.Email,
            Phone = o.Customer.Phone ?? string.Empty,
            Address = o.ShippingAddress?.Street ?? string.Empty,
            Status = o.Status.ToString(),
            TrackingId = o.TrackingNumber ?? string.Empty,
            Subtotal = o.Subtotal,
            Discount = o.DiscountAmount,
            DeliveryFee = o.DeliveryFee,
            Tax = o.TaxAmount,
            Total = o.TotalAmount,
            PaymentMethod = o.PaymentMethod.ToString(),
            PaymentStatus = o.PaymentStatus.ToString(),
            Items = o.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                Title = i.ProductName,
                Qty = i.Quantity,
                Price = i.UnitPrice,
                Img = i.ImageUrl ?? string.Empty
            }).ToList()
        }).ToList();
    }
}

public record GetOrderByIdQuery(string Id, string? RequesterEmail = null, bool IsAdmin = false) : IRequest<Result<OrderDto>>;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, Result<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOrderByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDto>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        Guid.TryParse(request.Id, out var orderGuid);

        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.ShippingAddress)
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == orderGuid || o.OrderNumber == request.Id, cancellationToken);

        if (order == null)
            return Result.Failure<OrderDto>(Error.NotFound("Order.NotFound", "Order not found"));

        // IDOR Protection: Non-admin users can only view their own orders
        if (!request.IsAdmin && !string.IsNullOrWhiteSpace(request.RequesterEmail))
        {
            if (!string.Equals(order.Customer.Email, request.RequesterEmail, StringComparison.OrdinalIgnoreCase))
            {
                return Result.Failure<OrderDto>(Error.Forbidden("Order.Forbidden", "You do not have permission to view this order."));
            }
        }

        return Result.Success(new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Date = order.OrderDate.ToString("dd MMM yyyy"),
            Customer = $"{order.Customer.FirstName} {order.Customer.LastName}".Trim(),
            Email = order.Customer.Email,
            Phone = order.Customer.Phone ?? string.Empty,
            Address = order.ShippingAddress?.Street ?? string.Empty,
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
            }).ToList(),
            StatusHistory = order.StatusHistory.OrderBy(s => s.CreatedAt).Select(s => new OrderStatusHistoryDto
            {
                Status = s.Status.ToString(),
                Note = s.Note,
                CreatedAt = s.CreatedAt.ToString("dd MMM yyyy HH:mm")
            }).ToList()
        });
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Features.Orders.Queries;

public record GetOrdersQuery(string? UserEmail = null, bool IsAdmin = false) : IRequest<List<Order>>;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, List<Order>>
{
    private readonly IApplicationDbContext _context;

    public GetOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Order>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders.AsNoTracking().AsQueryable();

        if (!request.IsAdmin && !string.IsNullOrWhiteSpace(request.UserEmail))
        {
            var email = request.UserEmail.Trim().ToLowerInvariant();
            query = query.Where(o => o.Email.ToLower() == email);
        }

        return await query.OrderByDescending(o => o.Id).ToListAsync(cancellationToken);
    }
}

public record GetOrderByIdQuery(string Id) : IRequest<Order?>;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, Order?>
{
    private readonly IApplicationDbContext _context;

    public GetOrderByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Order?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Enums;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Admin;

public record GetAdminKpisQuery : IRequest<AdminKpiDto>;

public class GetAdminKpisQueryHandler : IRequestHandler<GetAdminKpisQuery, AdminKpiDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminKpisQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminKpiDto> Handle(GetAdminKpisQuery request, CancellationToken cancellationToken)
    {
        var totalRevenue = await _context.Orders
            .Where(o => o.Status != OrderStatus.Cancelled)
            .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0m;

        var totalOrders = await _context.Orders.CountAsync(cancellationToken);
        var totalCustomers = await _context.Customers.CountAsync(cancellationToken);
        var totalProducts = await _context.Products.CountAsync(cancellationToken);
        var pendingOrders = await _context.Orders
            .CountAsync(o => o.Status == OrderStatus.Placed || o.Status == OrderStatus.Processing, cancellationToken);

        return new AdminKpiDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            TotalCustomers = totalCustomers,
            TotalProducts = totalProducts,
            PendingOrders = pendingOrders
        };
    }
}

public record GetAdminUsersQuery : IRequest<IReadOnlyList<AdminUserDto>>;

public class GetAdminUsersQueryHandler : IRequestHandler<GetAdminUsersQuery, IReadOnlyList<AdminUserDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAdminUsersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<AdminUserDto>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(u => u.Customer)
            .ThenInclude(c => c!.Orders)
            .ToListAsync(cancellationToken);

        return users.Select(u => new AdminUserDto
        {
            Id = u.Id,
            Name = $"{u.FirstName} {u.LastName}".Trim(),
            Email = u.Email,
            Role = u.UserRoles.FirstOrDefault()?.Role.Name ?? "Customer",
            Status = u.IsActive ? "Active" : "Disabled",
            OrdersCount = u.Customer?.Orders.Count ?? 0,
            JoinedAt = u.CreatedAt
        }).ToList();
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;

namespace AaryaMart.Application.Features.Admin.Queries;

public record AdminKpisDto(
    decimal TotalRevenue,
    int TotalOrders,
    int TotalCustomers,
    int LowStockProducts,
    int TotalProducts,
    Dictionary<string, int> StatusCounts,
    Dictionary<string, int> CategoryDistribution,
    List<RecentOrderDto> RecentOrders
);

public record RecentOrderDto(
    string Id,
    string Customer,
    string Date,
    decimal Total,
    string Status,
    int ItemsCount
);

public record AdminUserDto(
    string Id,
    string Name,
    string Email,
    string Phone,
    string Role,
    string Status,
    int OrdersCount,
    DateTime JoinedAt
);

public record GetAdminKpisQuery() : IRequest<AdminKpisDto>;

public class GetAdminKpisQueryHandler : IRequestHandler<GetAdminKpisQuery, AdminKpisDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminKpisQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminKpisDto> Handle(GetAdminKpisQuery request, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders.AsNoTracking().ToListAsync(cancellationToken);
        var products = await _context.Products.AsNoTracking().ToListAsync(cancellationToken);
        var users = await _context.Users.AsNoTracking().ToListAsync(cancellationToken);

        decimal totalRevenue = orders.Where(o => o.Status != "Cancelled").Sum(o => o.Total);
        int totalOrders = orders.Count;
        int customerCount = users.Count(u => u.Role == "Customer");
        int lowStockCount = products.Count(p => !p.InStock || p.StockCount < 10);

        var statusCounts = orders
            .GroupBy(o => o.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        var categoryDistribution = products
            .GroupBy(p => p.Category)
            .ToDictionary(g => g.Key, g => g.Count());

        var recentOrders = orders
            .OrderByDescending(o => o.Id)
            .Take(5)
            .Select(o => new RecentOrderDto(
                o.Id,
                o.Customer,
                o.Date,
                o.Total,
                o.Status,
                o.Items?.Count ?? 0
            ))
            .ToList();

        return new AdminKpisDto(
            totalRevenue,
            totalOrders,
            customerCount > 0 ? customerCount : users.Count,
            lowStockCount,
            products.Count,
            statusCounts,
            categoryDistribution,
            recentOrders
        );
    }
}

public record GetAdminUsersQuery() : IRequest<List<AdminUserDto>>;

public class GetAdminUsersQueryHandler : IRequestHandler<GetAdminUsersQuery, List<AdminUserDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAdminUsersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminUserDto>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        return await _context.Users.AsNoTracking()
            .Select(u => new AdminUserDto(
                u.Id,
                u.Name,
                u.Email,
                u.Phone,
                u.Role,
                u.Status,
                u.OrdersCount,
                u.JoinedAt
            ))
            .ToListAsync(cancellationToken);
    }
}

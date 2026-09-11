using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Api.Repositories;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IDataStore _dataStore;

    public AdminController(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet("kpis")]
    public async Task<ActionResult<object>> GetKpis()
    {
        var orders = (await _dataStore.GetAllOrdersAsync()).ToList();
        var products = (await _dataStore.GetProductsAsync()).ToList();
        var users = (await _dataStore.GetUsersAsync()).ToList();

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
            .Select(o => new
            {
                o.Id,
                o.Customer,
                o.Date,
                o.Total,
                o.Status,
                ItemsCount = o.Items.Count
            });

        return Ok(new
        {
            totalRevenue,
            totalOrders,
            totalCustomers = customerCount > 0 ? customerCount : users.Count,
            lowStockProducts = lowStockCount,
            totalProducts = products.Count,
            statusCounts,
            categoryDistribution,
            recentOrders
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<object>>> GetUsers()
    {
        var users = await _dataStore.GetUsersAsync();
        var sanitized = users.Select(u => new
        {
            u.Id,
            u.Name,
            u.Email,
            u.Phone,
            u.Role,
            u.Status,
            u.OrdersCount,
            u.JoinedAt
        });

        return Ok(sanitized);
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = "Active";
    }

    [HttpPut("users/{id}/status")]
    public async Task<ActionResult> UpdateUserStatus(string id, [FromBody] UpdateStatusRequest req)
    {
        var success = await _dataStore.UpdateUserStatusAsync(id, req.Status);
        if (!success)
            return NotFound(new { message = $"User with ID '{id}' not found." });

        return Ok(new { message = $"User status updated to '{req.Status}'.", userId = id, status = req.Status });
    }
}

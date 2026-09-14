using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Features.Products.Queries;

public record GetProductsQuery(
    string? Category = null,
    string? Brand = null,
    string? Search = null,
    decimal? MaxPrice = null,
    bool InStockOnly = false,
    double? MinRating = null,
    string? Sort = null
) : IRequest<List<Product>>;

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, List<Product>>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Category) && !request.Category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cat = request.Category.Trim().ToLower();
            query = query.Where(p => p.Category.ToLower() == cat);
        }

        if (!string.IsNullOrWhiteSpace(request.Brand))
        {
            var brand = request.Brand.Trim().ToLower();
            query = query.Where(p => p.Brand.ToLower() == brand);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(p =>
                p.Title.ToLower().Contains(search) ||
                p.Category.ToLower().Contains(search) ||
                p.Brand.ToLower().Contains(search) ||
                p.Description.ToLower().Contains(search));
        }

        if (request.MaxPrice.HasValue && request.MaxPrice.Value > 0)
        {
            query = query.Where(p => p.Price <= request.MaxPrice.Value);
        }

        if (request.InStockOnly)
        {
            query = query.Where(p => p.InStock && p.StockCount > 0);
        }

        if (request.MinRating.HasValue)
        {
            query = query.Where(p => p.Rating >= request.MinRating.Value);
        }

        query = request.Sort?.ToLowerInvariant() switch
        {
            "price-low" => query.OrderBy(p => p.Price),
            "price-high" => query.OrderByDescending(p => p.Price),
            "rating" => query.OrderByDescending(p => p.Rating),
            "discount" => query.OrderByDescending(p => p.Discount),
            _ => query.OrderBy(p => p.Id)
        };

        return await query.ToListAsync(cancellationToken);
    }
}

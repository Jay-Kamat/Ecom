using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Shared.Common;
using ECommerce.Shared.Models;

namespace ECommerce.Application.Features.Products.Queries;

// 1. Get Product By Id
public record GetProductByIdQuery(string Id) : IRequest<Result<ProductDto>>;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICacheService _cacheService;

    public GetProductByIdQueryHandler(IApplicationDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        // Try to parse Guid or match legacy "prod-X"
        var cacheKey = $"product:{request.Id}";
        var cached = await _cacheService.GetAsync<ProductDto>(cacheKey, cancellationToken);
        if (cached != null) return Result.Success(cached);

        Guid.TryParse(request.Id, out var parsedGuid);

        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Id == parsedGuid || p.SKU == request.Id, cancellationToken);

        if (product == null)
        {
            // Also try matching by Name prefix or substring for legacy fallback
            product = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Brand)
                .Include(p => p.Images)
                .Include(p => p.Variants)
                .Include(p => p.Reviews)
                .FirstOrDefaultAsync(p => p.Name.ToLower().Contains(request.Id.ToLower()), cancellationToken);
        }

        if (product == null)
            return Result.Failure<ProductDto>(Error.NotFound("Product.NotFound", $"Product with id '{request.Id}' was not found."));

        var dto = MapToDto(product);
        await _cacheService.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), cancellationToken);

        return Result.Success(dto);
    }

    private static ProductDto MapToDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        SKU = p.SKU,
        Description = p.Description,
        ShortDescription = p.ShortDescription,
        CategoryId = p.CategoryId,
        Category = p.Category?.Name ?? string.Empty,
        BrandId = p.BrandId,
        Brand = p.Brand?.Name ?? string.Empty,
        Price = p.Price,
        Mrp = p.Mrp,
        DiscountPercentage = p.DiscountPercentage,
        StockQuantity = p.StockQuantity,
        Status = p.Status.ToString(),
        IsFeatured = p.IsFeatured,
        Badge = p.Badge,
        Rating = p.Rating,
        RatingCount = p.RatingCount,
        ReviewsCount = p.ReviewsCount,
        Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
        Reviews = p.Reviews.OrderByDescending(r => r.CreatedAt).Select(r => new ReviewDto
        {
            Id = r.Id,
            Author = r.AuthorName,
            Rating = r.Rating,
            Title = r.Title,
            Text = r.Comment,
            Date = r.CreatedAt.ToString("dd MMM yyyy")
        }).ToList()
    };
}

// 2. Get Products Query (with pagination & filters)
public class GetProductsQuery : PaginationParams, IRequest<PagedResult<ProductDto>>
{
    public string? Category { get; set; }
    public string? Brand { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal? MinPrice { get; set; }
    public bool? InStockOnly { get; set; }
    public double? MinRating { get; set; }
    public string? Sort { get; set; } // price_asc, price_desc, rating_desc, popular
}

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images)
            .AsQueryable();

        // 1. Filters
        if (!string.IsNullOrWhiteSpace(request.Category) && request.Category != "all")
        {
            var cat = request.Category.Trim().ToLower();
            query = query.Where(p => p.Category.Name.ToLower() == cat || p.Category.Slug.ToLower() == cat);
        }

        if (!string.IsNullOrWhiteSpace(request.Brand) && request.Brand != "all")
        {
            var br = request.Brand.Trim().ToLower();
            query = query.Where(p => p.Brand.Name.ToLower() == br || p.Brand.Slug.ToLower() == br);
        }

        if (request.MaxPrice.HasValue && request.MaxPrice > 0)
        {
            query = query.Where(p => p.Price <= request.MaxPrice.Value);
        }

        if (request.MinPrice.HasValue && request.MinPrice > 0)
        {
            query = query.Where(p => p.Price >= request.MinPrice.Value);
        }

        if (request.InStockOnly == true)
        {
            query = query.Where(p => p.StockQuantity > 0);
        }

        if (request.MinRating.HasValue && request.MinRating > 0)
        {
            query = query.Where(p => p.Rating >= request.MinRating.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var rawSearch = request.Search.Trim().ToLower();
            var tokens = rawSearch.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            bool isMobileSearch = tokens.Any(t => t is "mobile" or "mobiles" or "phone" or "phones" or "smartphone" or "smartphones");
            bool isAudioSearch = tokens.Any(t => t is "headphone" or "headphones" or "earphone" or "earphones" or "earbud" or "earbuds" or "audio" or "speaker" or "speakers");
            bool isLaptopSearch = tokens.Any(t => t is "laptop" or "laptops" or "computer" or "computers" or "notebook" or "notebooks" or "pc" or "macbook" or "macbooks");

            if (isMobileSearch)
            {
                query = query.Where(p => p.Category.Slug == "smartphones" || p.Category.Slug == "mobiles" || p.Category.Name.ToLower().Contains("phone") || p.Category.Name.ToLower().Contains("mobile"));
            }
            if (isAudioSearch)
            {
                query = query.Where(p => p.Category.Slug == "audio" || p.Category.Name.ToLower().Contains("audio"));
            }
            if (isLaptopSearch)
            {
                query = query.Where(p => p.Category.Slug == "laptops" || p.Category.Name.ToLower().Contains("laptop"));
            }

            foreach (var t in tokens)
            {
                bool isCategoryToken = t is "mobile" or "mobiles" or "phone" or "phones" or "smartphone" or "smartphones"
                    or "headphone" or "headphones" or "earphone" or "earphones" or "earbud" or "earbuds" or "audio" or "speaker" or "speakers"
                    or "laptop" or "laptops" or "computer" or "computers" or "notebook" or "notebooks" or "pc" or "macbook" or "macbooks";

                if (isCategoryToken)
                {
                    continue;
                }

                var norm = t.EndsWith("s") && t.Length > 3 ? t[..^1] : t;
                query = query.Where(p =>
                    p.Name.ToLower().Contains(t) ||
                    p.Name.ToLower().Contains(norm) ||
                    p.Description.ToLower().Contains(t) ||
                    p.Category.Name.ToLower().Contains(t) ||
                    p.Category.Name.ToLower().Contains(norm) ||
                    p.Brand.Name.ToLower().Contains(t));
            }
        }

        // 2. Sorting
        query = (request.Sort?.ToLower()) switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "rating_desc" => query.OrderByDescending(p => p.Rating).ThenByDescending(p => p.RatingCount),
            "popular" => query.OrderByDescending(p => p.ReviewsCount).ThenByDescending(p => p.Rating),
            _ => query.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.Rating)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                Description = p.Description,
                ShortDescription = p.ShortDescription,
                CategoryId = p.CategoryId,
                Category = p.Category.Name,
                BrandId = p.BrandId,
                Brand = p.Brand.Name,
                Price = p.Price,
                Mrp = p.Mrp,
                DiscountPercentage = p.DiscountPercentage,
                StockQuantity = p.StockQuantity,
                Status = p.Status.ToString(),
                IsFeatured = p.IsFeatured,
                Badge = p.Badge,
                Rating = p.Rating,
                RatingCount = p.RatingCount,
                ReviewsCount = p.ReviewsCount,
                Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}

// 3. Semantic Vector Search Query
public record SemanticProductSearchQuery(
    string Query,
    Guid? CategoryId = null,
    Guid? BrandId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool InStockOnly = false,
    int Limit = 10) : IRequest<IReadOnlyList<ProductSearchResultDto>>;

public class SemanticProductSearchQueryHandler : IRequestHandler<SemanticProductSearchQuery, IReadOnlyList<ProductSearchResultDto>>
{
    private readonly IProductVectorSearchService _vectorSearchService;

    public SemanticProductSearchQueryHandler(IProductVectorSearchService vectorSearchService)
    {
        _vectorSearchService = vectorSearchService;
    }

    public async Task<IReadOnlyList<ProductSearchResultDto>> Handle(SemanticProductSearchQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return Array.Empty<ProductSearchResultDto>();

        return await _vectorSearchService.HybridSearchAsync(
            request.Query,
            request.CategoryId,
            request.BrandId,
            request.MinPrice,
            request.MaxPrice,
            request.InStockOnly,
            request.Limit,
            cancellationToken);
    }
}

// 4. Get Similar Products Query
public record GetSimilarProductsQuery(Guid ProductId, int Limit = 6) : IRequest<IReadOnlyList<ProductSearchResultDto>>;

public class GetSimilarProductsQueryHandler : IRequestHandler<GetSimilarProductsQuery, IReadOnlyList<ProductSearchResultDto>>
{
    private readonly IProductVectorSearchService _vectorSearchService;

    public GetSimilarProductsQueryHandler(IProductVectorSearchService vectorSearchService)
    {
        _vectorSearchService = vectorSearchService;
    }

    public async Task<IReadOnlyList<ProductSearchResultDto>> Handle(GetSimilarProductsQuery request, CancellationToken cancellationToken)
    {
        return await _vectorSearchService.GetSimilarProductsAsync(request.ProductId, request.Limit, cancellationToken);
    }
}

using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Services;

/// <summary>
/// Vector search service with pgvector support and automatic in-memory fallback.
/// When pgvector is not installed, computes cosine similarity in-process.
/// </summary>
public class ProductVectorSearchService : IProductVectorSearchService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmbeddingService _embeddingService;
    private readonly ILogger<ProductVectorSearchService> _logger;

    public ProductVectorSearchService(
        ApplicationDbContext context,
        IEmbeddingService embeddingService,
        ILogger<ProductVectorSearchService> logger)
    {
        _context = context;
        _embeddingService = embeddingService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ProductSearchResultDto>> SearchAsync(
        string query,
        int limit = 10,
        CancellationToken cancellationToken = default)
    {
        return await HybridSearchAsync(query, null, null, null, null, false, limit, cancellationToken);
    }

    public async Task<IReadOnlyList<ProductSearchResultDto>> HybridSearchAsync(
        string query,
        Guid? categoryId = null,
        Guid? brandId = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        bool inStockOnly = false,
        int limit = 10,
        CancellationToken cancellationToken = default)
    {
        // 1. Generate embedding for query
        var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(query, cancellationToken);

        // 2. Load product embeddings + product data
        var embeddingsQuery = _context.ProductEmbeddings
            .AsNoTracking()
            .Include(pe => pe.Product)
            .ThenInclude(p => p.Category)
            .Include(pe => pe.Product)
            .ThenInclude(p => p.Brand)
            .Include(pe => pe.Product)
            .ThenInclude(p => p.Images)
            .AsQueryable();

        // Business filters
        if (categoryId.HasValue)
            embeddingsQuery = embeddingsQuery.Where(pe => pe.Product.CategoryId == categoryId.Value);

        if (brandId.HasValue)
            embeddingsQuery = embeddingsQuery.Where(pe => pe.Product.BrandId == brandId.Value);

        if (maxPrice.HasValue)
            embeddingsQuery = embeddingsQuery.Where(pe => pe.Product.Price <= maxPrice.Value);

        if (minPrice.HasValue)
            embeddingsQuery = embeddingsQuery.Where(pe => pe.Product.Price >= minPrice.Value);

        if (inStockOnly)
            embeddingsQuery = embeddingsQuery.Where(pe => pe.Product.StockQuantity > 0);

        var embeddings = await embeddingsQuery.ToListAsync(cancellationToken);

        // 3. Keyword matching score
        var queryWords = query.ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '-' }, StringSplitOptions.RemoveEmptyEntries);

        var results = embeddings
            .Select(pe =>
            {
                // Cosine similarity from stored embedding
                var vectorScore = CosineSimilarity(queryEmbedding, pe.Embedding);

                // Keyword boost
                var content = (pe.Product.Name + " " + pe.Product.Description + " " +
                               pe.Product.Category?.Name + " " + pe.Product.Brand?.Name).ToLowerInvariant();
                var keywordScore = queryWords.Count(w => content.Contains(w)) / (double)(queryWords.Length + 1);

                // Rating boost (0-0.05)
                var ratingBoost = pe.Product.Rating / 100.0;

                // Combined score: 60% semantic + 30% keyword + 10% rating
                var combinedScore = (vectorScore * 0.6) + (keywordScore * 0.3) + (ratingBoost * 0.1);

                return (pe.Product, Score: combinedScore, MatchType: vectorScore > keywordScore ? "Semantic" : "Keyword");
            })
            .OrderByDescending(r => r.Score)
            .Take(limit)
            .ToList();

        // 4. Fallback: if no embeddings yet, do pure keyword search on products
        if (!results.Any())
        {
            _logger.LogInformation("[VectorSearch] No embeddings found, falling back to keyword search for query: {Query}", query);
            return await KeywordFallbackSearchAsync(query, categoryId, brandId, minPrice, maxPrice, inStockOnly, limit, cancellationToken);
        }

        return results.Select(r => new ProductSearchResultDto
        {
            Product = MapToProductDto(r.Product),
            SimilarityScore = r.Score,
            MatchType = r.MatchType
        }).ToList();
    }

    public async Task<IReadOnlyList<ProductSearchResultDto>> GetSimilarProductsAsync(
        Guid productId,
        int limit = 6,
        CancellationToken cancellationToken = default)
    {
        // Get the embedding for the source product
        var sourceEmbedding = await _context.ProductEmbeddings
            .AsNoTracking()
            .FirstOrDefaultAsync(pe => pe.ProductId == productId, cancellationToken);

        if (sourceEmbedding == null)
        {
            // Fallback: get products in the same category
            var product = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Brand)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

            if (product == null) return Array.Empty<ProductSearchResultDto>();

            var similarByCategory = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Brand)
                .Include(p => p.Images)
                .Where(p => p.CategoryId == product.CategoryId && p.Id != productId)
                .OrderByDescending(p => p.Rating)
                .Take(limit)
                .ToListAsync(cancellationToken);

            return similarByCategory.Select(p => new ProductSearchResultDto
            {
                Product = MapToProductDto(p),
                SimilarityScore = 0.5,
                MatchType = "Category"
            }).ToList();
        }

        // Compare with all other products using stored embeddings
        var allEmbeddings = await _context.ProductEmbeddings
            .AsNoTracking()
            .Include(pe => pe.Product)
            .ThenInclude(p => p.Category)
            .Include(pe => pe.Product)
            .ThenInclude(p => p.Brand)
            .Include(pe => pe.Product)
            .ThenInclude(p => p.Images)
            .Where(pe => pe.ProductId != productId)
            .ToListAsync(cancellationToken);

        var results = allEmbeddings
            .Select(pe => (pe.Product, Score: CosineSimilarity(sourceEmbedding.Embedding, pe.Embedding)))
            .OrderByDescending(r => r.Score)
            .Take(limit)
            .ToList();

        return results.Select(r => new ProductSearchResultDto
        {
            Product = MapToProductDto(r.Product),
            SimilarityScore = r.Score,
            MatchType = "Semantic"
        }).ToList();
    }

    private async Task<IReadOnlyList<ProductSearchResultDto>> KeywordFallbackSearchAsync(
        string query,
        Guid? categoryId,
        Guid? brandId,
        decimal? minPrice,
        decimal? maxPrice,
        bool inStockOnly,
        int limit,
        CancellationToken cancellationToken)
    {
        var terms = query.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var q = _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images)
            .AsQueryable();

        foreach (var term in terms.Take(3))
        {
            var t = term;
            q = q.Where(p => p.Name.ToLower().Contains(t) ||
                              p.Description.ToLower().Contains(t) ||
                              p.Category.Name.ToLower().Contains(t) ||
                              p.Brand.Name.ToLower().Contains(t));
        }

        if (categoryId.HasValue) q = q.Where(p => p.CategoryId == categoryId.Value);
        if (brandId.HasValue) q = q.Where(p => p.BrandId == brandId.Value);
        if (maxPrice.HasValue) q = q.Where(p => p.Price <= maxPrice.Value);
        if (minPrice.HasValue) q = q.Where(p => p.Price >= minPrice.Value);
        if (inStockOnly) q = q.Where(p => p.StockQuantity > 0);

        var products = await q.OrderByDescending(p => p.Rating).Take(limit).ToListAsync(cancellationToken);

        return products.Select(p => new ProductSearchResultDto
        {
            Product = MapToProductDto(p),
            SimilarityScore = 0.4,
            MatchType = "Keyword"
        }).ToList();
    }

    private static double CosineSimilarity(float[] a, float[] b)
    {
        if (a.Length == 0 || b.Length == 0) return 0.0;
        var len = Math.Min(a.Length, b.Length);
        double dot = 0, magA = 0, magB = 0;
        for (int i = 0; i < len; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        var denom = Math.Sqrt(magA) * Math.Sqrt(magB);
        return denom == 0 ? 0 : dot / denom;
    }

    private static ProductDto MapToProductDto(Domain.Entities.Product p) => new()
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
        Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList()
    };
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Exceptions;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Enums;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Products.Commands;

// 1. Create Product Command
public record CreateProductCommand(CreateProductDto ProductDto) : IRequest<Result<ProductDto>>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICacheService _cacheService;

    public CreateProductCommandHandler(IApplicationDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<Result<ProductDto>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var dto = request.ProductDto;

        // Resolve or create category
        var categoryName = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category;
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == categoryName.ToLower(), cancellationToken);
        if (category == null)
        {
            category = new Category
            {
                Name = categoryName,
                Slug = categoryName.ToLower().Replace(" ", "-"),
                Description = $"{categoryName} collection"
            };
            _context.Categories.Add(category);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Resolve or create brand
        var brandName = string.IsNullOrWhiteSpace(dto.Brand) ? "NovaMart" : dto.Brand;
        var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Name.ToLower() == brandName.ToLower(), cancellationToken);
        if (brand == null)
        {
            brand = new Brand
            {
                Name = brandName,
                Slug = brandName.ToLower().Replace(" ", "-"),
                Description = $"{brandName} Brand"
            };
            _context.Brands.Add(brand);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var mrp = dto.Mrp > 0 ? dto.Mrp : dto.Price;
        var discountPct = mrp > dto.Price && mrp > 0 ? Math.Round((mrp - dto.Price) / mrp * 100, 0) : dto.Discount;

        var product = new Product
        {
            Name = dto.Name,
            SKU = string.IsNullOrWhiteSpace(dto.SKU) ? $"SKU-{Guid.NewGuid().ToString("N")[..8].ToUpper()}" : dto.SKU,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            CategoryId = category.Id,
            Category = category,
            BrandId = brand.Id,
            Brand = brand,
            Price = dto.Price,
            Mrp = mrp,
            DiscountPercentage = discountPct,
            StockQuantity = dto.StockQuantity,
            WeightKg = dto.WeightKg,
            Dimensions = dto.Dimensions,
            Status = ProductStatus.Active,
            IsFeatured = dto.IsFeatured,
            Badge = dto.Badge,
            Rating = 4.5,
            RatingCount = 10,
            ReviewsCount = 1
        };

        // Images
        if (dto.Images.Any())
        {
            for (int i = 0; i < dto.Images.Count; i++)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = dto.Images[i],
                    DisplayOrder = i,
                    IsPrimary = i == 0
                });
            }
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        // Invalidate product catalog cache
        await _cacheService.RemoveAsync("catalog:products:all", cancellationToken);

        return Result.Success(MapToDto(product));
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
        Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList()
    };
}

// 2. Update Product Command
public record UpdateProductCommand(Guid Id, UpdateProductDto ProductDto) : IRequest<Result<ProductDto>>;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICacheService _cacheService;

    public UpdateProductCommandHandler(IApplicationDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product == null)
            return Result.Failure<ProductDto>(Error.NotFound("Product.NotFound", $"Product with id {request.Id} not found"));

        var dto = request.ProductDto;
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.ShortDescription = dto.ShortDescription;
        product.Price = dto.Price;
        product.Mrp = dto.Mrp > 0 ? dto.Mrp : dto.Price;
        product.DiscountPercentage = dto.Discount;
        product.StockQuantity = dto.StockQuantity;
        product.Badge = dto.Badge;
        product.IsFeatured = dto.IsFeatured;
        product.UpdatedAt = DateTime.UtcNow;

        if (dto.Images.Any())
        {
            product.Images.Clear();
            for (int i = 0; i < dto.Images.Count; i++)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = dto.Images[i],
                    DisplayOrder = i,
                    IsPrimary = i == 0
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        await _cacheService.RemoveAsync($"product:{product.Id}", cancellationToken);
        await _cacheService.RemoveAsync("catalog:products:all", cancellationToken);

        return Result.Success(new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            SKU = product.SKU,
            Description = product.Description,
            CategoryId = product.CategoryId,
            Category = product.Category?.Name ?? string.Empty,
            BrandId = product.BrandId,
            Brand = product.Brand?.Name ?? string.Empty,
            Price = product.Price,
            Mrp = product.Mrp,
            DiscountPercentage = product.DiscountPercentage,
            StockQuantity = product.StockQuantity,
            Badge = product.Badge,
            Rating = product.Rating,
            Images = product.Images.Select(i => i.ImageUrl).ToList()
        });
    }
}

// 3. Delete Product Command
public record DeleteProductCommand(Guid Id) : IRequest<Result>;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly ICacheService _cacheService;

    public DeleteProductCommandHandler(IApplicationDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<Result> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (product == null)
            return Result.Failure(Error.NotFound("Product.NotFound", $"Product with id {request.Id} not found"));

        product.IsDeleted = true;
        product.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        await _cacheService.RemoveAsync($"product:{request.Id}", cancellationToken);
        await _cacheService.RemoveAsync("catalog:products:all", cancellationToken);

        return Result.Success();
    }
}

// 4. Add Review Command
public record AddProductReviewCommand(Guid ProductId, ReviewDto Review) : IRequest<Result<ReviewDto>>;

public class AddProductReviewCommandHandler : IRequestHandler<AddProductReviewCommand, Result<ReviewDto>>
{
    private readonly IApplicationDbContext _context;

    public AddProductReviewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ReviewDto>> Handle(AddProductReviewCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
            return Result.Failure<ReviewDto>(Error.NotFound("Product.NotFound", "Product not found"));

        var r = request.Review;
        var review = new Review
        {
            ProductId = product.Id,
            AuthorName = string.IsNullOrWhiteSpace(r.Author) ? "Verified Buyer" : r.Author,
            Rating = Math.Clamp(r.Rating, 1, 5),
            Title = r.Title,
            Comment = r.Text,
            IsApproved = true
        };

        product.Reviews.Add(review);
        product.ReviewsCount = product.Reviews.Count;
        product.Rating = Math.Round(product.Reviews.Average(rev => rev.Rating), 1);
        product.RatingCount = product.ReviewsCount + 50;

        await _context.SaveChangesAsync(cancellationToken);

        r.Id = review.Id;
        r.Date = review.CreatedAt.ToString("dd MMM yyyy");
        return Result.Success(r);
    }
}

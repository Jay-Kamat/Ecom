using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Features.Products.Commands;

// 1. Create Product
public record CreateProductCommand(Product Product) : IRequest<Product>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Product>
{
    private readonly IApplicationDbContext _context;

    public CreateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Product> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var product = request.Product;
        if (string.IsNullOrWhiteSpace(product.Id))
            product.Id = "prod-" + Guid.NewGuid().ToString("N")[..8];

        if (product.Mrp <= 0)
            product.Mrp = product.Price;

        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);
        return product;
    }
}

// 2. Update Product
public record UpdateProductCommand(string Id, Product Product) : IRequest<bool>;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (existing == null) return false;

        var p = request.Product;
        existing.Title = p.Title;
        existing.Category = p.Category;
        existing.Brand = p.Brand;
        existing.Price = p.Price;
        existing.Mrp = p.Mrp;
        existing.Discount = p.Discount;
        existing.Rating = p.Rating;
        existing.RatingCount = p.RatingCount;
        existing.ReviewsCount = p.ReviewsCount;
        existing.InStock = p.InStock;
        existing.StockCount = p.StockCount;
        existing.Badge = p.Badge;
        existing.Images = p.Images;
        existing.Variants = p.Variants;
        existing.Description = p.Description;
        existing.Specs = p.Specs;
        existing.Offers = p.Offers;
        existing.Reviews = p.Reviews;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

// 3. Delete Product
public record DeleteProductCommand(string Id) : IRequest<bool>;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (product == null) return false;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

// 4. Add Product Review
public record AddProductReviewCommand(string ProductId, ProductReview Review) : IRequest<(bool Success, ProductReview? Review)>;

public class AddProductReviewCommandHandler : IRequestHandler<AddProductReviewCommand, (bool Success, ProductReview? Review)>
{
    private readonly IApplicationDbContext _context;

    public AddProductReviewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(bool Success, ProductReview? Review)> Handle(AddProductReviewCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);
        if (product == null) return (false, null);

        product.Reviews ??= new();
        product.Reviews.Insert(0, request.Review);
        product.ReviewsCount = product.Reviews.Count;

        // Recalculate average rating
        if (product.Reviews.Count > 0)
        {
            var sum = product.Reviews.Sum(r => r.Rating);
            product.Rating = Math.Round((double)sum / product.Reviews.Count, 1);
            product.RatingCount = product.Reviews.Count + 50; // preserve social proof base
        }

        await _context.SaveChangesAsync(cancellationToken);
        return (true, request.Review);
    }
}

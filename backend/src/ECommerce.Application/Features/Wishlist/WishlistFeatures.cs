using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Wishlist;

public record GetWishlistQuery(string UserEmail) : IRequest<IReadOnlyList<string>>;

public class GetWishlistQueryHandler : IRequestHandler<GetWishlistQuery, IReadOnlyList<string>>
{
    private readonly IApplicationDbContext _context;

    public GetWishlistQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<string>> Handle(GetWishlistQuery request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .Include(c => c.Wishlist)
            .ThenInclude(w => w!.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.Email.ToLower() == request.UserEmail.ToLower(), cancellationToken);

        if (customer?.Wishlist == null)
            return Array.Empty<string>();

        return customer.Wishlist.Items
            .Select(i => i.Product?.SKU ?? i.ProductId.ToString())
            .ToList();
    }
}

public record AddToWishlistCommand(string UserEmail, string ProductId) : IRequest<Result>;

public class AddToWishlistCommandHandler : IRequestHandler<AddToWishlistCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public AddToWishlistCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(AddToWishlistCommand request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .Include(c => c.Wishlist)
            .ThenInclude(w => w!.Items)
            .FirstOrDefaultAsync(c => c.Email.ToLower() == request.UserEmail.ToLower(), cancellationToken);

        if (customer == null)
        {
            customer = new Customer
            {
                Email = request.UserEmail,
                FirstName = request.UserEmail.Split('@')[0]
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);
        }

        if (customer.Wishlist == null)
        {
            customer.Wishlist = new Domain.Entities.Wishlist { CustomerId = customer.Id };
            _context.Wishlists.Add(customer.Wishlist);
            await _context.SaveChangesAsync(cancellationToken);
        }

        Guid.TryParse(request.ProductId, out var prodId);
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == prodId || p.SKU == request.ProductId, cancellationToken);
        if (product == null)
            return Result.Failure(Error.NotFound("Product.NotFound", "Product not found"));

        if (!customer.Wishlist.Items.Any(i => i.ProductId == product.Id))
        {
            customer.Wishlist.Items.Add(new WishlistItem
            {
                WishlistId = customer.Wishlist.Id,
                ProductId = product.Id,
                Product = product
            });
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result.Success();
    }
}

public record RemoveFromWishlistCommand(string UserEmail, string ProductId) : IRequest<Result>;

public class RemoveFromWishlistCommandHandler : IRequestHandler<RemoveFromWishlistCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public RemoveFromWishlistCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(RemoveFromWishlistCommand request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .Include(c => c.Wishlist)
            .ThenInclude(w => w!.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.Email.ToLower() == request.UserEmail.ToLower(), cancellationToken);

        if (customer?.Wishlist != null)
        {
            Guid.TryParse(request.ProductId, out var prodId);
            var item = customer.Wishlist.Items.FirstOrDefault(i => i.ProductId == prodId || i.Product?.SKU == request.ProductId);
            if (item != null)
            {
                customer.Wishlist.Items.Remove(item);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return Result.Success();
    }
}

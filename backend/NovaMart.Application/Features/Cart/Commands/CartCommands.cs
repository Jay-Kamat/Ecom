using MediatR;
using Microsoft.EntityFrameworkCore;
using NovaMart.Application.Common.Interfaces;
using NovaMart.Domain.Entities;

namespace NovaMart.Application.Features.Cart.Commands;

public record SaveCartCommand(string UserEmail, List<CartItem> Items) : IRequest<bool>;

public class SaveCartCommandHandler : IRequestHandler<SaveCartCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public SaveCartCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(SaveCartCommand request, CancellationToken cancellationToken)
    {
        var email = request.UserEmail.Trim().ToLowerInvariant();
        var cart = await _context.UserCarts.FirstOrDefaultAsync(c => c.UserEmail == email, cancellationToken);
        if (cart == null)
        {
            cart = new UserCart { UserEmail = email, Items = request.Items };
            _context.UserCarts.Add(cart);
        }
        else
        {
            cart.Items = request.Items;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record SaveWishlistCommand(string UserEmail, List<string> ProductIds) : IRequest<bool>;

public class SaveWishlistCommandHandler : IRequestHandler<SaveWishlistCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public SaveWishlistCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(SaveWishlistCommand request, CancellationToken cancellationToken)
    {
        var email = request.UserEmail.Trim().ToLowerInvariant();
        var wishlist = await _context.UserWishlists.FirstOrDefaultAsync(w => w.UserEmail == email, cancellationToken);
        if (wishlist == null)
        {
            wishlist = new UserWishlist { UserEmail = email, ProductIds = request.ProductIds };
            _context.UserWishlists.Add(wishlist);
        }
        else
        {
            wishlist.ProductIds = request.ProductIds;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

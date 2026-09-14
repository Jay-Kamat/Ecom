using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Features.Cart.Queries;

public record GetCartQuery(string UserEmail) : IRequest<UserCart>;

public class GetCartQueryHandler : IRequestHandler<GetCartQuery, UserCart>
{
    private readonly IApplicationDbContext _context;

    public GetCartQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserCart> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        var email = request.UserEmail.Trim().ToLowerInvariant();
        var cart = await _context.UserCarts.AsNoTracking().FirstOrDefaultAsync(c => c.UserEmail == email, cancellationToken);
        return cart ?? new UserCart { UserEmail = email, Items = new() };
    }
}

public record GetWishlistQuery(string UserEmail) : IRequest<UserWishlist>;

public class GetWishlistQueryHandler : IRequestHandler<GetWishlistQuery, UserWishlist>
{
    private readonly IApplicationDbContext _context;

    public GetWishlistQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserWishlist> Handle(GetWishlistQuery request, CancellationToken cancellationToken)
    {
        var email = request.UserEmail.Trim().ToLowerInvariant();
        var wishlist = await _context.UserWishlists.AsNoTracking().FirstOrDefaultAsync(w => w.UserEmail == email, cancellationToken);
        return wishlist ?? new UserWishlist { UserEmail = email, ProductIds = new() };
    }
}

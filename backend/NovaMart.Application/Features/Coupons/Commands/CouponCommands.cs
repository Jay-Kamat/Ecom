using MediatR;
using Microsoft.EntityFrameworkCore;
using NovaMart.Application.Common.Interfaces;
using NovaMart.Domain.Entities;

namespace NovaMart.Application.Features.Coupons.Commands;

public record CreateCouponCommand(Coupon Coupon) : IRequest<Coupon>;

public class CreateCouponCommandHandler : IRequestHandler<CreateCouponCommand, Coupon>
{
    private readonly IApplicationDbContext _context;

    public CreateCouponCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Coupon> Handle(CreateCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = request.Coupon;
        coupon.Code = coupon.Code.Trim().ToUpperInvariant();

        var existing = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == coupon.Code, cancellationToken);
        if (existing != null)
        {
            existing.DiscountPercent = coupon.DiscountPercent;
            existing.DiscountFlat = coupon.DiscountFlat;
            existing.MinCart = coupon.MinCart;
            existing.Description = coupon.Description;
            existing.Validity = coupon.Validity;
            await _context.SaveChangesAsync(cancellationToken);
            return existing;
        }

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync(cancellationToken);
        return coupon;
    }
}

public record DeleteCouponCommand(string Code) : IRequest<bool>;

public class DeleteCouponCommandHandler : IRequestHandler<DeleteCouponCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteCouponCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteCouponCommand request, CancellationToken cancellationToken)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code, cancellationToken);
        if (coupon == null) return false;

        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

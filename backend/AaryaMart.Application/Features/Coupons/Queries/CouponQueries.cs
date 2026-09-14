using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Features.Coupons.Queries;

public record ValidateCouponResult(
    bool Valid,
    string Code,
    decimal Discount,
    string Description,
    decimal MinCart,
    string? Message = null
);

public record GetCouponsQuery() : IRequest<List<Coupon>>;

public class GetCouponsQueryHandler : IRequestHandler<GetCouponsQuery, List<Coupon>>
{
    private readonly IApplicationDbContext _context;

    public GetCouponsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Coupon>> Handle(GetCouponsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Coupons.AsNoTracking().ToListAsync(cancellationToken);
    }
}

public record ValidateCouponQuery(string Code, decimal Subtotal) : IRequest<ValidateCouponResult>;

public class ValidateCouponQueryHandler : IRequestHandler<ValidateCouponQuery, ValidateCouponResult>
{
    private readonly IApplicationDbContext _context;

    public ValidateCouponQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ValidateCouponResult> Handle(ValidateCouponQuery request, CancellationToken cancellationToken)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var coupon = await _context.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Code == code, cancellationToken);
        if (coupon == null)
        {
            return new ValidateCouponResult(false, code, 0, string.Empty, 0, "Invalid coupon code.");
        }

        if (request.Subtotal > 0 && request.Subtotal < coupon.MinCart)
        {
            return new ValidateCouponResult(
                false,
                code,
                0,
                coupon.Description,
                coupon.MinCart,
                $"This coupon requires a minimum cart value of ₹{coupon.MinCart:N0}."
            );
        }

        decimal discount = 0;
        if (coupon.DiscountPercent.HasValue)
        {
            discount = Math.Round(request.Subtotal * (coupon.DiscountPercent.Value / 100m), 2);
        }
        else if (coupon.DiscountFlat.HasValue)
        {
            discount = Math.Min(coupon.DiscountFlat.Value, request.Subtotal > 0 ? request.Subtotal : coupon.DiscountFlat.Value);
        }

        return new ValidateCouponResult(true, coupon.Code, discount, coupon.Description, coupon.MinCart);
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Coupons;

public record GetCouponsQuery : IRequest<IReadOnlyList<CouponDto>>;

public class GetCouponsQueryHandler : IRequestHandler<GetCouponsQuery, IReadOnlyList<CouponDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCouponsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CouponDto>> Handle(GetCouponsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Coupons
            .AsNoTracking()
            .Where(c => c.IsActive)
            .Select(c => new CouponDto
            {
                Code = c.Code,
                Description = c.Description,
                Type = c.DiscountType == DiscountType.Percentage ? "percent" : "flat",
                DiscountFlat = c.DiscountAmount,
                MinCart = c.MinimumPurchase,
                IsActive = c.IsActive
            })
            .ToListAsync(cancellationToken);
    }
}

public record ValidateCouponQuery(string Code, decimal Subtotal) : IRequest<Result<ValidateCouponResponseDto>>;

public class ValidateCouponQueryHandler : IRequestHandler<ValidateCouponQuery, Result<ValidateCouponResponseDto>>
{
    private readonly IApplicationDbContext _context;

    public ValidateCouponQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ValidateCouponResponseDto>> Handle(ValidateCouponQuery request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Code.ToUpper() == request.Code.ToUpper(), cancellationToken);

        if (coupon == null || !coupon.IsActive)
            return Result.Failure<ValidateCouponResponseDto>(Error.NotFound("Coupon.Invalid", "Coupon code is invalid or expired."));

        if (request.Subtotal < coupon.MinimumPurchase)
            return Result.Failure<ValidateCouponResponseDto>(Error.Validation("Coupon.MinOrder", $"Minimum cart total of ₹{coupon.MinimumPurchase} required."));

        decimal discount = coupon.DiscountType == DiscountType.Percentage
            ? Math.Round(request.Subtotal * (coupon.DiscountAmount / 100m), 2)
            : coupon.DiscountAmount;

        if (coupon.MaxDiscount.HasValue && discount > coupon.MaxDiscount.Value)
            discount = coupon.MaxDiscount.Value;

        var finalTotal = Math.Max(0, request.Subtotal - discount);

        return Result.Success(new ValidateCouponResponseDto
        {
            Valid = true,
            Code = coupon.Code,
            Discount = discount,
            FinalTotal = finalTotal,
            Message = $"Applied ₹{discount} savings successfully!"
        });
    }
}

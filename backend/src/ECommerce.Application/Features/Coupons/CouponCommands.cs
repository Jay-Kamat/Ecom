using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Enums;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Coupons;

public record CreateCouponCommand(
    string Code,
    string Description,
    string Type,  // "percent" or "flat"
    decimal DiscountAmount,
    decimal MinimumPurchase,
    decimal? MaxDiscount) : IRequest<Result<Guid>>;

public class CreateCouponCommandHandler : IRequestHandler<CreateCouponCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateCouponCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateCouponCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Coupons
            .AnyAsync(c => c.Code.ToUpper() == request.Code.ToUpper(), cancellationToken);

        if (existing)
            return Result.Failure<Guid>(Error.Conflict("Coupon.Exists", "Coupon code already exists"));

        var coupon = new Coupon
        {
            Code = request.Code.ToUpper(),
            Description = request.Description,
            DiscountType = string.Equals(request.Type, "percent", StringComparison.OrdinalIgnoreCase)
                ? DiscountType.Percentage : DiscountType.Flat,
            DiscountAmount = request.DiscountAmount,
            MinimumPurchase = request.MinimumPurchase,
            MaxDiscount = request.MaxDiscount,
            IsActive = true
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success(coupon.Id);
    }
}

public record DeleteCouponCommand(Guid Id) : IRequest<Result>;

public class DeleteCouponCommandHandler : IRequestHandler<DeleteCouponCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteCouponCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons.FindAsync(new object[] { request.Id }, cancellationToken);

        if (coupon == null)
            return Result.Failure(Error.NotFound("Coupon.NotFound", "Coupon not found"));

        coupon.IsActive = false; // Soft deactivate
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

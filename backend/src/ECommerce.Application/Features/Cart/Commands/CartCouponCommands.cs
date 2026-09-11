using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Enums;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Cart.Commands;

/// <summary>Applies a coupon code to the cart and returns updated pricing summary.</summary>
public record ApplyCouponToCartCommand(string UserEmail, string CouponCode) : IRequest<Result<CartCouponResult>>;

public record CartCouponResult(
    CartDto Cart,
    string CouponCode,
    decimal Discount,
    decimal FinalTotal);

public class ApplyCouponToCartCommandHandler : IRequestHandler<ApplyCouponToCartCommand, Result<CartCouponResult>>
{
    private readonly IApplicationDbContext _context;

    public ApplyCouponToCartCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CartCouponResult>> Handle(ApplyCouponToCartCommand request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .Include(c => c.Cart)
            .ThenInclude(cart => cart!.Items)
            .ThenInclude(item => item.Product)
            .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(c => c.Email.ToLower() == request.UserEmail.ToLower(), cancellationToken);

        if (customer?.Cart == null)
            return Result.Failure<CartCouponResult>(Error.NotFound("Cart.NotFound", "Cart not found"));

        var coupon = await _context.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Code.ToUpper() == request.CouponCode.ToUpper() && c.IsActive, cancellationToken);

        if (coupon == null)
            return Result.Failure<CartCouponResult>(Error.NotFound("Coupon.Invalid", "Coupon code is invalid or expired"));

        var subtotal = customer.Cart.Items.Sum(i => i.Quantity * i.UnitPrice);

        if (subtotal < coupon.MinimumPurchase)
            return Result.Failure<CartCouponResult>(Error.Validation("Coupon.MinOrder",
                $"Minimum cart total of ₹{coupon.MinimumPurchase} required"));

        decimal discount = coupon.DiscountType == DiscountType.Percentage
            ? Math.Round(subtotal * (coupon.DiscountAmount / 100m), 2)
            : coupon.DiscountAmount;

        if (coupon.MaxDiscount.HasValue && discount > coupon.MaxDiscount.Value)
            discount = coupon.MaxDiscount.Value;

        var cartDto = new CartDto
        {
            Id = customer.Cart.Id,
            CustomerId = customer.Id,
            Items = customer.Cart.Items.Select(i => new CartItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductTitle = i.Product?.Name ?? string.Empty,
                ProductImage = i.Product?.Images.FirstOrDefault()?.ImageUrl ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        };

        return Result.Success(new CartCouponResult(
            cartDto, coupon.Code, discount, Math.Max(0, subtotal - discount)));
    }
}

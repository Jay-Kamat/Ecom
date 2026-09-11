using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Api.Models;
using NovaMart.Api.Repositories;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CouponsController : ControllerBase
{
    private readonly IDataStore _dataStore;

    public CouponsController(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Coupon>>> GetAll()
    {
        var coupons = await _dataStore.GetCouponsAsync();
        return Ok(coupons);
    }

    [HttpGet("validate/{code}")]
    public async Task<ActionResult<object>> Validate(string code, [FromQuery] decimal subtotal = 0)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { valid = false, message = "Coupon code is required." });

        var coupon = await _dataStore.GetCouponByCodeAsync(code.Trim().ToUpperInvariant());
        if (coupon == null)
            return NotFound(new { valid = false, message = "Invalid coupon code." });

        if (subtotal > 0 && subtotal < coupon.MinCart)
        {
            return BadRequest(new
            {
                valid = false,
                message = $"This coupon requires a minimum cart value of ₹{coupon.MinCart:N0}."
            });
        }

        decimal discount = 0;
        if (coupon.DiscountPercent.HasValue)
        {
            discount = Math.Round(subtotal * (coupon.DiscountPercent.Value / 100m), 2);
        }
        else if (coupon.DiscountFlat.HasValue)
        {
            discount = Math.Min(coupon.DiscountFlat.Value, subtotal > 0 ? subtotal : coupon.DiscountFlat.Value);
        }

        return Ok(new
        {
            valid = true,
            code = coupon.Code,
            discount,
            description = coupon.Description,
            minCart = coupon.MinCart
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Coupon>> Create([FromBody] Coupon coupon)
    {
        if (string.IsNullOrWhiteSpace(coupon.Code))
            return BadRequest(new { message = "Coupon code is required." });

        coupon.Code = coupon.Code.Trim().ToUpperInvariant();
        var created = await _dataStore.CreateCouponAsync(coupon);
        return CreatedAtAction(nameof(Validate), new { code = created.Code }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{code}")]
    public async Task<ActionResult> Delete(string code)
    {
        var deleted = await _dataStore.DeleteCouponAsync(code.Trim().ToUpperInvariant());
        if (!deleted)
            return NotFound(new { message = $"Coupon '{code}' not found." });

        return Ok(new { message = $"Coupon '{code}' deleted successfully." });
    }
}

using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AaryaMart.Application.Features.Coupons.Commands;
using AaryaMart.Application.Features.Coupons.Queries;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CouponsController : ControllerBase
{
    private readonly ISender _mediator;

    public CouponsController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Coupon>>> GetAll()
    {
        var coupons = await _mediator.Send(new GetCouponsQuery());
        return Ok(coupons);
    }

    [HttpGet("validate/{code}")]
    public async Task<ActionResult<object>> Validate(string code, [FromQuery] decimal subtotal = 0)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { valid = false, message = "Coupon code is required." });

        var result = await _mediator.Send(new ValidateCouponQuery(code, subtotal));
        if (!result.Valid)
        {
            if (result.Message != null && result.Message.Contains("minimum cart"))
                return BadRequest(new { valid = false, message = result.Message });

            return NotFound(new { valid = false, message = result.Message ?? "Invalid coupon code." });
        }

        return Ok(new
        {
            valid = true,
            code = result.Code,
            discount = result.Discount,
            description = result.Description,
            minCart = result.MinCart
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Coupon>> Create([FromBody] Coupon coupon)
    {
        if (string.IsNullOrWhiteSpace(coupon.Code))
            return BadRequest(new { message = "Coupon code is required." });

        var created = await _mediator.Send(new CreateCouponCommand(coupon));
        return CreatedAtAction(nameof(Validate), new { code = created.Code }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{code}")]
    public async Task<ActionResult> Delete(string code)
    {
        var success = await _mediator.Send(new DeleteCouponCommand(code));
        if (!success)
            return NotFound(new { message = $"Coupon '{code}' not found." });

        return Ok(new { message = $"Coupon '{code}' deleted successfully." });
    }
}

using ECommerce.Application.Features.Coupons;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[Route("api/[controller]")]
public class CouponsController : ApiBaseController
{
    private readonly IMediator _mediator;
    public CouponsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("validate")]
    [AllowAnonymous]
    public async Task<IActionResult> Validate([FromBody] ValidateCouponRequest request, CancellationToken ct)
        => OkOrError(await _mediator.Send(new ValidateCouponQuery(request.Code, request.Subtotal), ct));

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _mediator.Send(new GetCouponsQuery(), ct));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCouponCommand command, CancellationToken ct)
        => OkOrError(await _mediator.Send(command, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => NoContentOrError(await _mediator.Send(new DeleteCouponCommand(id), ct));
}

public record ValidateCouponRequest(string Code, decimal Subtotal);

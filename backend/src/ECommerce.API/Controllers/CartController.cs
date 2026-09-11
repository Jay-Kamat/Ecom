using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.Features.Cart.Commands;
using ECommerce.Application.Features.Cart.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[Route("api/[controller]")]
[Authorize]
public class CartController : ApiBaseController
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public CartController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    private string UserEmail => _currentUser.Email ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => OkOrError(await _mediator.Send(new GetCartQuery(UserEmail), ct));

    [HttpPost("add")]
    public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request, CancellationToken ct)
        => OkOrError(await _mediator.Send(new AddToCartCommand(UserEmail, request.ProductId.ToString(), request.Quantity), ct));

    [HttpDelete("items/{productId:guid}")]
    public async Task<IActionResult> RemoveItem(Guid productId, CancellationToken ct)
        => OkOrError(await _mediator.Send(new RemoveFromCartCommand(UserEmail, productId.ToString()), ct));

    [HttpDelete("clear")]
    public async Task<IActionResult> Clear(CancellationToken ct)
        => NoContentOrError(await _mediator.Send(new ClearCartCommand(UserEmail), ct));

    [HttpPost("coupon")]
    public async Task<IActionResult> ApplyCoupon([FromBody] ApplyCouponRequest request, CancellationToken ct)
        => OkOrError(await _mediator.Send(new ApplyCouponToCartCommand(UserEmail, request.Code), ct));
}

public record AddCartItemRequest(Guid ProductId, int Quantity = 1);
public record ApplyCouponRequest(string Code);

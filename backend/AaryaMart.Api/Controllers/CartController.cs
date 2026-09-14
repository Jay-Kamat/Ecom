using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using AaryaMart.Application.Features.Cart.Commands;
using AaryaMart.Application.Features.Cart.Queries;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ISender _mediator;

    public CartController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<UserCart>> GetCart([FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email ?? "guest@aaryamart.in";
        var cart = await _mediator.Send(new GetCartQuery(userEmail));
        return Ok(cart);
    }

    [HttpPost]
    public async Task<ActionResult> SaveCart([FromBody] UserCart cart)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? cart.UserEmail;
        if (string.IsNullOrWhiteSpace(userEmail))
            userEmail = "guest@aaryamart.in";

        await _mediator.Send(new SaveCartCommand(userEmail, cart.Items));
        return Ok(new { message = "Cart saved successfully." });
    }

    [HttpGet("wishlist")]
    public async Task<ActionResult<UserWishlist>> GetWishlist([FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email ?? "guest@aaryamart.in";
        var wishlist = await _mediator.Send(new GetWishlistQuery(userEmail));
        return Ok(wishlist);
    }

    [HttpPost("wishlist")]
    public async Task<ActionResult> SaveWishlist([FromBody] UserWishlist wishlist)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? wishlist.UserEmail;
        if (string.IsNullOrWhiteSpace(userEmail))
            userEmail = "guest@aaryamart.in";

        await _mediator.Send(new SaveWishlistCommand(userEmail, wishlist.ProductIds));
        return Ok(new { message = "Wishlist saved successfully." });
    }
}

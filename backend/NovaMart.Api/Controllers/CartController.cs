using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Api.Models;
using NovaMart.Api.Repositories;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly IDataStore _dataStore;

    public CartController(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet]
    public async Task<ActionResult<UserCart>> GetCart([FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email ?? "guest@novamart.in";
        var cart = await _dataStore.GetCartAsync(userEmail.Trim().ToLowerInvariant());
        return Ok(cart);
    }

    [HttpPost]
    public async Task<ActionResult> SaveCart([FromBody] UserCart cart)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? cart.UserEmail;
        if (string.IsNullOrWhiteSpace(userEmail))
            userEmail = "guest@novamart.in";

        cart.UserEmail = userEmail.Trim().ToLowerInvariant();
        await _dataStore.SaveCartAsync(cart);
        return Ok(new { message = "Cart saved successfully." });
    }

    [HttpGet("wishlist")]
    public async Task<ActionResult<UserWishlist>> GetWishlist([FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email ?? "guest@novamart.in";
        var wishlist = await _dataStore.GetWishlistAsync(userEmail.Trim().ToLowerInvariant());
        return Ok(wishlist);
    }

    [HttpPost("wishlist")]
    public async Task<ActionResult> SaveWishlist([FromBody] UserWishlist wishlist)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? wishlist.UserEmail;
        if (string.IsNullOrWhiteSpace(userEmail))
            userEmail = "guest@novamart.in";

        wishlist.UserEmail = userEmail.Trim().ToLowerInvariant();
        await _dataStore.SaveWishlistAsync(wishlist);
        return Ok(new { message = "Wishlist saved successfully." });
    }
}

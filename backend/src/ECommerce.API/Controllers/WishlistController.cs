using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.Features.Wishlist;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[Route("api/[controller]")]
[Authorize]
public class WishlistController : ApiBaseController
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public WishlistController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    private string UserEmail => _currentUser.Email ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => Ok(await _mediator.Send(new GetWishlistQuery(UserEmail), ct));

    [HttpPost("{productId:guid}")]
    public async Task<IActionResult> Add(Guid productId, CancellationToken ct)
        => NoContentOrError(await _mediator.Send(new AddToWishlistCommand(UserEmail, productId.ToString()), ct));

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> Remove(Guid productId, CancellationToken ct)
        => NoContentOrError(await _mediator.Send(new RemoveFromWishlistCommand(UserEmail, productId.ToString()), ct));
}

using ECommerce.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

/// <summary>Auth API – registration, login, profile.</summary>
[Route("api/[controller]")]
public class AuthController : ApiBaseController
{
    private readonly IMediator _mediator;
    public AuthController(IMediator mediator) => _mediator = mediator;

    // POST api/auth/register
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken ct)
        => OkOrError(await _mediator.Send(command, ct));

    // POST api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
        => OkOrError(await _mediator.Send(command, ct));

    // GET api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(
        [FromServices] Application.Common.Interfaces.ICurrentUserService currentUser,
        CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated) return Unauthorized();
        return OkOrError(await _mediator.Send(new GetProfileQuery(currentUser.Email!), ct));
    }
}

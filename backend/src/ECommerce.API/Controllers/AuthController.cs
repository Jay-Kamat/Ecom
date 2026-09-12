using ECommerce.Application.DTOs;
using ECommerce.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ECommerce.API.Controllers;

/// <summary>Auth API – registration, login, token refresh, password recovery, profile.</summary>
[Route("api/[controller]")]
public class AuthController : ApiBaseController
{
    private readonly IMediator _mediator;
    public AuthController(IMediator mediator) => _mediator = mediator;

    // POST api/auth/register
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("Auth")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken ct)
        => OkOrError(await _mediator.Send(command, ct));

    // POST api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("Auth")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
        => OkOrError(await _mediator.Send(command, ct));

    // POST api/auth/refresh
    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("Auth")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto, CancellationToken ct)
        => OkOrError(await _mediator.Send(new RefreshTokenCommand(dto), ct));

    // POST api/auth/revoke
    [HttpPost("revoke")]
    [Authorize]
    public async Task<IActionResult> Revoke(
        [FromServices] Application.Common.Interfaces.ICurrentUserService currentUser,
        CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || string.IsNullOrWhiteSpace(currentUser.Email))
            return Unauthorized();

        return NoContentOrError(await _mediator.Send(new RevokeTokenCommand(currentUser.Email), ct));
    }

    // POST api/auth/forgot-password
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("Auth")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto, CancellationToken ct)
        => OkOrError(await _mediator.Send(new ForgotPasswordCommand(dto.Email), ct));

    // POST api/auth/reset-password
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("Auth")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto, CancellationToken ct)
        => NoContentOrError(await _mediator.Send(new ResetPasswordCommand(dto), ct));

    // GET api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(
        [FromServices] Application.Common.Interfaces.ICurrentUserService currentUser,
        CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || string.IsNullOrWhiteSpace(currentUser.Email))
            return Unauthorized();

        return OkOrError(await _mediator.Send(new GetProfileQuery(currentUser.Email), ct));
    }
}

using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Application.Features.Auth.Commands;
using NovaMart.Application.Features.Auth.Queries;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ISender _mediator;

    public AuthController(ISender mediator)
    {
        _mediator = mediator;
    }

    public record RegisterRequestDto(string Name, string Email, string? Phone, string Password, string Role = "Customer");

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var (success, error, response) = await _mediator.Send(new RegisterCommand(req.Name, req.Email, req.Phone, req.Password, req.Role));
        if (!success)
            return Conflict(new { message = error });

        return Ok(response);
    }

    public record LoginRequestDto(string Email, string Password);

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var (success, error, statusCode, response) = await _mediator.Send(new LoginCommand(req.Email, req.Password));
        if (!success)
            return StatusCode(statusCode, new { message = error });

        return Ok(response);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<object>> GetProfile()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email))
            return Unauthorized(new { message = "Invalid token claims." });

        var profile = await _mediator.Send(new GetUserProfileQuery(email));
        if (profile == null)
            return NotFound(new { message = "User not found." });

        return Ok(profile);
    }
}

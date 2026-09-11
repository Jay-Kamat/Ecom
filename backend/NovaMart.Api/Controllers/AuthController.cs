using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Api.Models;
using NovaMart.Api.Repositories;
using NovaMart.Api.Services;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IDataStore _dataStore;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthController(IDataStore dataStore, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _dataStore = dataStore;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var existing = await _dataStore.GetUserByEmailAsync(req.Email.Trim().ToLowerInvariant());
        if (existing != null)
            return Conflict(new { message = "An account with this email already exists." });

        var (hash, salt) = _passwordHasher.HashPassword(req.Password);

        var newUser = new User
        {
            Id = Guid.NewGuid().ToString(),
            Name = string.IsNullOrWhiteSpace(req.Name) ? "Shopper" : req.Name.Trim(),
            Email = req.Email.Trim().ToLowerInvariant(),
            Phone = req.Phone?.Trim() ?? string.Empty,
            PasswordHash = hash,
            PasswordSalt = salt,
            Role = string.Equals(req.Role, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Customer",
            Status = "Active",
            OrdersCount = 0,
            JoinedAt = DateTime.UtcNow
        };

        var created = await _dataStore.CreateUserAsync(newUser);
        var token = _tokenService.GenerateToken(created);

        return Ok(new AuthResponse
        {
            Token = token,
            Id = created.Id,
            Name = created.Name,
            Email = created.Email,
            Role = created.Role
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var user = await _dataStore.GetUserByEmailAsync(req.Email.Trim().ToLowerInvariant());
        if (user == null)
            return Unauthorized(new { message = "Invalid email or password." });

        if (user.Status == "Disabled")
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Your account has been deactivated. Please contact support." });

        var valid = _passwordHasher.VerifyPassword(req.Password, user.PasswordHash, user.PasswordSalt);
        if (!valid)
            return Unauthorized(new { message = "Invalid email or password." });

        var token = _tokenService.GenerateToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role
        });
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<object>> GetProfile()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email))
            return Unauthorized(new { message = "Invalid token claims." });

        var user = await _dataStore.GetUserByEmailAsync(email);
        if (user == null)
            return NotFound(new { message = "User not found." });

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.Phone,
            user.Role,
            user.Status,
            user.OrdersCount,
            user.JoinedAt
        });
    }
}

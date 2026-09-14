using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Features.Auth.Commands;

public record AuthResponseDto(string Token, string Id, string Name, string Email, string Role);

public record RegisterCommand(string Name, string Email, string? Phone, string Password, string Role = "Customer")
    : IRequest<(bool Success, string? ErrorMessage, AuthResponseDto? Response)>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, (bool Success, string? ErrorMessage, AuthResponseDto? Response)>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public RegisterCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<(bool Success, string? ErrorMessage, AuthResponseDto? Response)> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existing = await _context.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (existing)
        {
            return (false, "An account with this email already exists.", null);
        }

        var (hash, salt) = _passwordHasher.HashPassword(request.Password);
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Name = string.IsNullOrWhiteSpace(request.Name) ? "Shopper" : request.Name.Trim(),
            Email = normalizedEmail,
            Phone = request.Phone?.Trim() ?? string.Empty,
            PasswordHash = hash,
            PasswordSalt = salt,
            Role = string.Equals(request.Role, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Customer",
            Status = "Active",
            OrdersCount = 0,
            JoinedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        var token = _tokenService.GenerateToken(user);
        var response = new AuthResponseDto(token, user.Id, user.Name, user.Email, user.Role);
        return (true, null, response);
    }
}

public record LoginCommand(string Email, string Password)
    : IRequest<(bool Success, string? ErrorMessage, int StatusCode, AuthResponseDto? Response)>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, (bool Success, string? ErrorMessage, int StatusCode, AuthResponseDto? Response)>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<(bool Success, string? ErrorMessage, int StatusCode, AuthResponseDto? Response)> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user == null)
        {
            return (false, "Invalid email or password.", 401, null);
        }

        if (user.Status == "Disabled")
        {
            return (false, "Your account has been deactivated. Please contact support.", 403, null);
        }

        var valid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt);
        if (!valid)
        {
            return (false, "Invalid email or password.", 401, null);
        }

        var token = _tokenService.GenerateToken(user);
        var response = new AuthResponseDto(token, user.Id, user.Name, user.Email, user.Role);
        return (true, null, 200, response);
    }
}

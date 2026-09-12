using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Auth;

public record LoginCommand(LoginRequestDto Dto) : IRequest<Result<AuthResponseDto>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(IApplicationDbContext context, IPasswordHasher hasher, ITokenService tokenService)
    {
        _context = context;
        _hasher = hasher;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Dto.Email.ToLower(), cancellationToken);

        if (user == null)
        {
            return Result.Failure<AuthResponseDto>(Error.Unauthorized("Auth.InvalidCredentials", "Invalid email or password"));
        }

        // Account Lockout check (Brute-Force defense)
        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
        {
            var remaining = Math.Max(1, (int)Math.Ceiling((user.LockoutEnd.Value - DateTime.UtcNow).TotalMinutes));
            return Result.Failure<AuthResponseDto>(Error.Forbidden("Auth.AccountLocked", $"Account is temporarily locked due to multiple failed login attempts. Please try again in {remaining} minute(s)."));
        }

        if (!_hasher.VerifyPassword(request.Dto.Password, user.PasswordHash, user.PasswordSalt))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
            }
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Failure<AuthResponseDto>(Error.Unauthorized("Auth.InvalidCredentials", "Invalid email or password"));
        }

        // Reset lockout and failed attempts on successful login
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        // Generate session refresh token
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync(cancellationToken);

        var roles = user.UserRoles.Select(r => r.Role.Name).ToList();
        var token = _tokenService.GenerateJwtToken(user, roles);

        return Result.Success(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Name = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email,
            Role = roles.FirstOrDefault() ?? "Customer"
        });
    }
}

public record RegisterCommand(RegisterRequestDto Dto) : IRequest<Result<AuthResponseDto>>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokenService;

    public RegisterCommandHandler(IApplicationDbContext context, IPasswordHasher hasher, ITokenService tokenService)
    {
        _context = context;
        _hasher = hasher;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponseDto>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower(), cancellationToken);
        if (existing != null)
            return Result.Failure<AuthResponseDto>(Error.Conflict("Auth.EmailExists", "An account with this email already exists"));

        var hash = _hasher.HashPassword(dto.Password, out var salt);
        var names = dto.Name.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);

        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        var user = new User
        {
            Email = dto.Email,
            PasswordHash = hash,
            PasswordSalt = salt,
            FirstName = names.Length > 0 ? names[0] : dto.Name,
            LastName = names.Length > 1 ? names[1] : string.Empty,
            Phone = dto.Phone,
            IsActive = true,
            RefreshToken = refreshToken,
            RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7)
        };

        // Assign Role (Only Customer or Seller can self-register; Admin must be assigned by Admin)
        var roleName = string.Equals(dto.Role, "Seller", StringComparison.OrdinalIgnoreCase) ? "Seller" : "Customer";
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == roleName.ToLower(), cancellationToken);
        if (role == null)
        {
            role = new Role { Name = roleName, Description = $"{roleName} Role" };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync(cancellationToken);
        }

        user.UserRoles.Add(new UserRole { User = user, Role = role });

        // Link Customer profile
        var customer = new Customer
        {
            UserId = user.Id,
            User = user,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone
        };
        _context.Customers.Add(customer);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        var roles = new[] { role.Name };
        var token = _tokenService.GenerateJwtToken(user, roles);

        return Result.Success(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Name = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email,
            Role = role.Name
        });
    }
}

public record RefreshTokenCommand(RefreshTokenRequestDto Dto) : IRequest<Result<AuthResponseDto>>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(IApplicationDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponseDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.RefreshToken == request.Dto.RefreshToken, cancellationToken);

        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return Result.Failure<AuthResponseDto>(Error.Unauthorized("Auth.InvalidRefreshToken", "Invalid or expired refresh token"));
        }

        // Rotate Refresh Token
        var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync(cancellationToken);

        var roles = user.UserRoles.Select(r => r.Role.Name).ToList();
        var newToken = _tokenService.GenerateJwtToken(user, roles);

        return Result.Success(new AuthResponseDto
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            Name = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email,
            Role = roles.FirstOrDefault() ?? "Customer"
        });
    }
}

public record RevokeTokenCommand(string Email) : IRequest<Result>;

public class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public RevokeTokenCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result> Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        if (user == null) return Result.Failure(Error.NotFound("User.NotFound", "User not found"));

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}

public record ForgotPasswordCommand(string Email) : IRequest<Result<string>>;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public ForgotPasswordCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<string>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        if (user == null)
        {
            // Do not disclose whether email exists (prevents account enumeration attacks)
            return Result.Success("If the email is registered, a password reset token has been sent.");
        }

        // Generate a 15-minute single-use secure reset token
        var resetToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(resetToken);
    }
}

public record ResetPasswordCommand(ResetPasswordRequestDto Dto) : IRequest<Result>;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _hasher;

    public ResetPasswordCommandHandler(IApplicationDbContext context, IPasswordHasher hasher)
    {
        _context = context;
        _hasher = hasher;
    }

    public async Task<Result> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Dto.Email.ToLower(), cancellationToken);
        if (user == null ||
            user.PasswordResetToken != request.Dto.Token ||
            !user.PasswordResetTokenExpiry.HasValue ||
            user.PasswordResetTokenExpiry.Value < DateTime.UtcNow)
        {
            return Result.Failure(Error.Validation("Auth.InvalidResetToken", "Invalid or expired password reset token"));
        }

        // Set new password
        user.PasswordHash = _hasher.HashPassword(request.Dto.NewPassword, out var salt);
        user.PasswordSalt = salt;
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        // Invalidate current refresh token to terminate all active sessions
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}

public record GetProfileQuery(string Email) : IRequest<Result<UserProfileDto>>;

public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, Result<UserProfileDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProfileQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<UserProfileDto>> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(u => u.Customer)
            .ThenInclude(c => c!.Orders)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (user == null)
            return Result.Failure<UserProfileDto>(Error.NotFound("User.NotFound", "User not found"));

        return Result.Success(new UserProfileDto
        {
            Id = user.Id,
            Name = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email,
            Phone = user.Phone ?? string.Empty,
            Role = user.UserRoles.FirstOrDefault()?.Role.Name ?? "Customer",
            OrdersCount = user.Customer?.Orders.Count ?? 0,
            JoinedAt = user.CreatedAt
        });
    }
}

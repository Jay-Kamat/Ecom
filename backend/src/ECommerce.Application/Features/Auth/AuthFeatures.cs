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

        if (user == null || !_hasher.VerifyPassword(request.Dto.Password, user.PasswordHash, user.PasswordSalt))
        {
            return Result.Failure<AuthResponseDto>(Error.Unauthorized("Auth.InvalidCredentials", "Invalid email or password"));
        }

        var roles = user.UserRoles.Select(r => r.Role.Name).ToList();
        var token = _tokenService.GenerateJwtToken(user, roles);

        return Result.Success(new AuthResponseDto
        {
            Token = token,
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

        var user = new User
        {
            Email = dto.Email,
            PasswordHash = hash,
            PasswordSalt = salt,
            FirstName = names.Length > 0 ? names[0] : dto.Name,
            LastName = names.Length > 1 ? names[1] : string.Empty,
            Phone = dto.Phone,
            IsActive = true
        };

        // Assign Role
        var roleName = string.Equals(dto.Role, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Customer";
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
            Name = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email,
            Role = role.Name
        });
    }
}

public record GetProfileQuery(string Email) : IRequest<Result<UserProfileDto>>;

public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, Result<UserProfileDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProfileQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

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

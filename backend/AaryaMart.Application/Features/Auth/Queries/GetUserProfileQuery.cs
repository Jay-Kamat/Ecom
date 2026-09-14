using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;

namespace AaryaMart.Application.Features.Auth.Queries;

public record UserProfileDto(
    string Id,
    string Name,
    string Email,
    string Phone,
    string Role,
    string Status,
    int OrdersCount,
    DateTime JoinedAt
);

public record GetUserProfileQuery(string Email) : IRequest<UserProfileDto?>;

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, UserProfileDto?>
{
    private readonly IApplicationDbContext _context;

    public GetUserProfileQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserProfileDto?> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user == null) return null;

        return new UserProfileDto(
            user.Id,
            user.Name,
            user.Email,
            user.Phone,
            user.Role,
            user.Status,
            user.OrdersCount,
            user.JoinedAt
        );
    }
}

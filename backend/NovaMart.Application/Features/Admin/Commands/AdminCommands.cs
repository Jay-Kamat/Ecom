using MediatR;
using Microsoft.EntityFrameworkCore;
using NovaMart.Application.Common.Interfaces;

namespace NovaMart.Application.Features.Admin.Commands;

public record UpdateUserStatusCommand(string Id, string Status) : IRequest<bool>;

public class UpdateUserStatusCommandHandler : IRequestHandler<UpdateUserStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);
        if (user == null) return false;

        user.Status = request.Status;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

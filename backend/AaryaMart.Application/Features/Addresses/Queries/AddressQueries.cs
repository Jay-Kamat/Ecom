using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Features.Addresses.Queries;

public record GetAddressesQuery(string UserEmail) : IRequest<List<SavedAddress>>;

public class GetAddressesQueryHandler : IRequestHandler<GetAddressesQuery, List<SavedAddress>>
{
    private readonly IApplicationDbContext _context;

    public GetAddressesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SavedAddress>> Handle(GetAddressesQuery request, CancellationToken cancellationToken)
    {
        var email = request.UserEmail.Trim().ToLowerInvariant();
        return await _context.SavedAddresses.AsNoTracking()
            .Where(a => a.UserEmail.ToLower() == email)
            .OrderByDescending(a => a.IsDefault)
            .ToListAsync(cancellationToken);
    }
}

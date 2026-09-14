using MediatR;
using Microsoft.EntityFrameworkCore;
using AaryaMart.Application.Common.Interfaces;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Features.Addresses.Commands;

public record CreateAddressCommand(SavedAddress Address, string? AuthenticatedEmail) : IRequest<SavedAddress>;

public class CreateAddressCommandHandler : IRequestHandler<CreateAddressCommand, SavedAddress>
{
    private readonly IApplicationDbContext _context;

    public CreateAddressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SavedAddress> Handle(CreateAddressCommand request, CancellationToken cancellationToken)
    {
        var address = request.Address;
        var email = !string.IsNullOrWhiteSpace(request.AuthenticatedEmail)
            ? request.AuthenticatedEmail.Trim().ToLowerInvariant()
            : (!string.IsNullOrWhiteSpace(address.UserEmail) ? address.UserEmail.Trim().ToLowerInvariant() : "arun.patel@gmail.com");

        if (string.IsNullOrWhiteSpace(address.Id))
            address.Id = "addr-" + Guid.NewGuid().ToString("N")[..8];

        address.UserEmail = email;

        // If this is marked default, unset default for others of this user
        if (address.IsDefault)
        {
            var userAddresses = await _context.SavedAddresses.Where(a => a.UserEmail == email).ToListAsync(cancellationToken);
            foreach (var a in userAddresses)
            {
                a.IsDefault = false;
            }
        }

        _context.SavedAddresses.Add(address);
        await _context.SaveChangesAsync(cancellationToken);
        return address;
    }
}

public record SetDefaultAddressCommand(string AddressId, string UserEmail) : IRequest<bool>;

public class SetDefaultAddressCommandHandler : IRequestHandler<SetDefaultAddressCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public SetDefaultAddressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(SetDefaultAddressCommand request, CancellationToken cancellationToken)
    {
        var email = request.UserEmail.Trim().ToLowerInvariant();
        var addresses = await _context.SavedAddresses.Where(a => a.UserEmail == email).ToListAsync(cancellationToken);
        var target = addresses.FirstOrDefault(a => a.Id == request.AddressId);
        if (target == null) return false;

        foreach (var a in addresses)
        {
            a.IsDefault = (a.Id == request.AddressId);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record DeleteAddressCommand(string AddressId) : IRequest<bool>;

public class DeleteAddressCommandHandler : IRequestHandler<DeleteAddressCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteAddressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await _context.SavedAddresses.FirstOrDefaultAsync(a => a.Id == request.AddressId, cancellationToken);
        if (address == null) return false;

        _context.SavedAddresses.Remove(address);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

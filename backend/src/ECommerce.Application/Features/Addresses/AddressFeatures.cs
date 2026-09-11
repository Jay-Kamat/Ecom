using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Addresses;

public record GetAddressesQuery(string? Email = null) : IRequest<IReadOnlyList<AddressDto>>;

public class GetAddressesQueryHandler : IRequestHandler<GetAddressesQuery, IReadOnlyList<AddressDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAddressesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<AddressDto>> Handle(GetAddressesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Addresses
            .AsNoTracking()
            .Include(a => a.Customer)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim().ToLower();
            query = query.Where(a => a.Customer.Email.ToLower() == email);
        }

        var addresses = await query.ToListAsync(cancellationToken);

        return addresses.Select(a => new AddressDto
        {
            Id = a.Id,
            UserEmail = a.Customer.Email,
            Tag = a.Tag,
            Name = a.FullName,
            Phone = a.Phone,
            Street = a.Street,
            City = a.City,
            State = a.State,
            Pin = a.PostalCode,
            IsDefault = a.IsDefault
        }).ToList();
    }
}

public record CreateAddressCommand(CreateAddressDto Dto) : IRequest<Result<AddressDto>>;

public class CreateAddressCommandHandler : IRequestHandler<CreateAddressCommand, Result<AddressDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateAddressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<AddressDto>> Handle(CreateAddressCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email.ToLower() == dto.UserEmail.ToLower(), cancellationToken);
        if (customer == null)
        {
            customer = new Customer
            {
                Email = dto.UserEmail,
                FirstName = dto.Name,
                Phone = dto.Phone
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var address = new Address
        {
            CustomerId = customer.Id,
            Customer = customer,
            Tag = dto.Tag,
            FullName = dto.Name,
            Phone = dto.Phone,
            Street = dto.Street,
            City = dto.City,
            State = dto.State,
            PostalCode = dto.Pin,
            IsDefault = dto.IsDefault
        };

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new AddressDto
        {
            Id = address.Id,
            UserEmail = customer.Email,
            Tag = address.Tag,
            Name = address.FullName,
            Phone = address.Phone,
            Street = address.Street,
            City = address.City,
            State = address.State,
            Pin = address.PostalCode,
            IsDefault = address.IsDefault
        });
    }
}

public record DeleteAddressCommand(Guid Id) : IRequest<Result>;

public class DeleteAddressCommandHandler : IRequestHandler<DeleteAddressCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteAddressCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);
        if (address == null)
            return Result.Failure(Error.NotFound("Address.NotFound", "Address not found"));

        address.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

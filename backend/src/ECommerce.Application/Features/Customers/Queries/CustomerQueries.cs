using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Customers.Queries;

public record GetCustomerByIdQuery(Guid Id) : IRequest<Result<CustomerDto>>;

public class GetCustomerByIdQueryHandler : IRequestHandler<GetCustomerByIdQuery, Result<CustomerDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCustomerByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CustomerDto>> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (customer == null)
            return Result.Failure<CustomerDto>(Error.NotFound("Customer.NotFound", "Customer not found"));

        return Result.Success(new CustomerDto
        {
            Id = customer.Id,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Email = customer.Email,
            Phone = customer.Phone,
            Addresses = customer.Addresses.Select(a => new AddressDto
            {
                Id = a.Id,
                UserEmail = customer.Email,
                Tag = a.Tag,
                Name = a.FullName,
                Phone = a.Phone,
                Street = a.Street,
                City = a.City,
                State = a.State,
                Pin = a.PostalCode,
                IsDefault = a.IsDefault
            }).ToList()
        });
    }
}

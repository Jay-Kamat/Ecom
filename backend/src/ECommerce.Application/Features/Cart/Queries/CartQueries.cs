using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Cart.Queries;

public record GetCartQuery(string UserEmail) : IRequest<Result<CartDto>>;

public class GetCartQueryHandler : IRequestHandler<GetCartQuery, Result<CartDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCartQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CartDto>> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .Include(c => c.Cart)
            .ThenInclude(cart => cart!.Items)
            .ThenInclude(item => item.Product)
            .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(c => c.Email.ToLower() == request.UserEmail.ToLower(), cancellationToken);

        if (customer?.Cart == null)
        {
            return Result.Success(new CartDto());
        }

        return Result.Success(new CartDto
        {
            Id = customer.Cart.Id,
            CustomerId = customer.Id,
            Items = customer.Cart.Items.Select(i => new CartItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductTitle = i.Product?.Name ?? string.Empty,
                ProductImage = i.Product?.Images.FirstOrDefault()?.ImageUrl ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        });
    }
}

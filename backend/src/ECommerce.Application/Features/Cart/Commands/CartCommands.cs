using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Cart.Commands;

public record AddToCartCommand(string UserEmail, string ProductId, int Quantity = 1) : IRequest<Result<CartDto>>;

public class AddToCartCommandHandler : IRequestHandler<AddToCartCommand, Result<CartDto>>
{
    private readonly IApplicationDbContext _context;

    public AddToCartCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CartDto>> Handle(AddToCartCommand request, CancellationToken cancellationToken)
    {
        // 1. Resolve Customer
        var customer = await _context.Customers
            .Include(c => c.Cart)
            .ThenInclude(cart => cart!.Items)
            .FirstOrDefaultAsync(c => c.Email.ToLower() == request.UserEmail.ToLower(), cancellationToken);

        if (customer == null)
        {
            customer = new Customer
            {
                Email = request.UserEmail,
                FirstName = request.UserEmail.Split('@')[0]
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);
        }

        if (customer.Cart == null)
        {
            customer.Cart = new Domain.Entities.Cart { CustomerId = customer.Id };
            _context.Carts.Add(customer.Cart);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 2. Resolve Product
        Guid.TryParse(request.ProductId, out var prodId);
        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == prodId || p.SKU == request.ProductId, cancellationToken);

        if (product == null)
            return Result.Failure<CartDto>(Error.NotFound("Product.NotFound", "Product not found"));

        var existingItem = customer.Cart.Items.FirstOrDefault(i => i.ProductId == product.Id);
        if (existingItem != null)
        {
            existingItem.Quantity += request.Quantity;
        }
        else
        {
            customer.Cart.Items.Add(new CartItem
            {
                CartId = customer.Cart.Id,
                ProductId = product.Id,
                Product = product,
                Quantity = request.Quantity,
                UnitPrice = product.Price
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new CartDto
        {
            Id = customer.Cart.Id,
            CustomerId = customer.Id,
            Items = customer.Cart.Items.Select(i => new CartItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductTitle = i.Product?.Name ?? product.Name,
                ProductImage = i.Product?.Images.FirstOrDefault()?.ImageUrl ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        });
    }
}

public record RemoveFromCartCommand(string UserEmail, string ProductId) : IRequest<Result<CartDto>>;

public class RemoveFromCartCommandHandler : IRequestHandler<RemoveFromCartCommand, Result<CartDto>>
{
    private readonly IApplicationDbContext _context;

    public RemoveFromCartCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CartDto>> Handle(RemoveFromCartCommand request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .Include(c => c.Cart)
            .ThenInclude(cart => cart!.Items)
            .ThenInclude(item => item.Product)
            .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(c => c.Email.ToLower() == request.UserEmail.ToLower(), cancellationToken);

        if (customer?.Cart == null)
            return Result.Success(new CartDto());

        Guid.TryParse(request.ProductId, out var prodId);
        var itemToRemove = customer.Cart.Items.FirstOrDefault(i => i.ProductId == prodId || i.Product.SKU == request.ProductId);

        if (itemToRemove != null)
        {
            customer.Cart.Items.Remove(itemToRemove);
            await _context.SaveChangesAsync(cancellationToken);
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

public record ClearCartCommand(string UserEmail) : IRequest<Result>;

public class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public ClearCartCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .Include(c => c.Cart)
            .ThenInclude(cart => cart!.Items)
            .FirstOrDefaultAsync(c => c.Email.ToLower() == request.UserEmail.ToLower(), cancellationToken);

        if (customer?.Cart != null)
        {
            customer.Cart.Items.Clear();
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result.Success();
    }
}

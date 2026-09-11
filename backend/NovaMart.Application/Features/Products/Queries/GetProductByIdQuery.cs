using MediatR;
using Microsoft.EntityFrameworkCore;
using NovaMart.Application.Common.Interfaces;
using NovaMart.Domain.Entities;

namespace NovaMart.Application.Features.Products.Queries;

public record GetProductByIdQuery(string Id) : IRequest<Product?>;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, Product?>
{
    private readonly IApplicationDbContext _context;

    public GetProductByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Product?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Categories.Queries;

public record GetCategoriesQuery : IRequest<IReadOnlyList<CategoryDto>>;

public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        return await _context.Categories
            .AsNoTracking()
            .Include(c => c.SubCategories)
            .Include(c => c.Products)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                ParentCategoryId = c.ParentCategoryId,
                ProductCount = c.Products.Count,
                SubCategories = c.SubCategories.Select(s => new SubCategoryDto
                {
                    Id = s.Id,
                    CategoryId = s.CategoryId,
                    Name = s.Name,
                    Slug = s.Slug,
                    Description = s.Description
                }).ToList()
            })
            .ToListAsync(cancellationToken);
    }
}

public record GetCategoryByIdQuery(Guid Id) : IRequest<Result<CategoryDto>>;

public class GetCategoryByIdQueryHandler : IRequestHandler<GetCategoryByIdQuery, Result<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoryByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CategoryDto>> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Include(c => c.SubCategories)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (category == null)
            return Result.Failure<CategoryDto>(Error.NotFound("Category.NotFound", "Category not found"));

        return Result.Success(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            ProductCount = category.Products.Count,
            SubCategories = category.SubCategories.Select(s => new SubCategoryDto
            {
                Id = s.Id,
                CategoryId = s.CategoryId,
                Name = s.Name,
                Slug = s.Slug,
                Description = s.Description
            }).ToList()
        });
    }
}

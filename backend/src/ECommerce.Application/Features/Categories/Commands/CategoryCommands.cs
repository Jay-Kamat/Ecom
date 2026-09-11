using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Categories.Commands;

public record CreateCategoryCommand(CreateCategoryDto Dto) : IRequest<Result<CategoryDto>>;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var existing = await _context.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Name.ToLower(), cancellationToken);
        if (existing != null)
            return Result.Failure<CategoryDto>(Error.Conflict("Category.Duplicate", "Category with this name already exists."));

        var category = new Category
        {
            Name = dto.Name,
            Slug = dto.Name.ToLower().Replace(" ", "-"),
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            ParentCategoryId = dto.ParentCategoryId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            ParentCategoryId = category.ParentCategoryId
        });
    }
}

public record UpdateCategoryCommand(Guid Id, UpdateCategoryDto Dto) : IRequest<Result<CategoryDto>>;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (category == null)
            return Result.Failure<CategoryDto>(Error.NotFound("Category.NotFound", "Category not found"));

        category.Name = request.Dto.Name;
        category.Slug = request.Dto.Name.ToLower().Replace(" ", "-");
        category.Description = request.Dto.Description;
        category.ImageUrl = request.Dto.ImageUrl;
        category.ParentCategoryId = request.Dto.ParentCategoryId;

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            ImageUrl = category.ImageUrl
        });
    }
}

public record DeleteCategoryCommand(Guid Id) : IRequest<Result>;

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (category == null)
            return Result.Failure(Error.NotFound("Category.NotFound", "Category not found"));

        category.IsDeleted = true;
        category.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

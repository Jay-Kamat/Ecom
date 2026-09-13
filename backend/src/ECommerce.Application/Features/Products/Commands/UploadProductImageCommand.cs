using MediatR;
using Microsoft.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Domain.Entities;
using ECommerce.Shared.Common;

namespace ECommerce.Application.Features.Products.Commands;

public record UploadProductImageCommand(
    Stream FileStream,
    string FileName,
    string ContentType,
    Guid? ProductId = null,
    bool IsPrimary = false,
    string? AltText = null
) : IRequest<Result<ImageUploadResponseDto>>;

public record ImageUploadResponseDto(
    string Url,
    long OriginalSizeBytes,
    long CompressedSizeBytes,
    double SavingsPercentage,
    int Width,
    int Height,
    string StorageProvider,
    Guid? ProductImageId = null
);

public class UploadProductImageCommandHandler : IRequestHandler<UploadProductImageCommand, Result<ImageUploadResponseDto>>
{
    private readonly IFileStorageService _fileStorageService;
    private readonly IApplicationDbContext _context;
    private readonly ICacheService _cacheService;

    public UploadProductImageCommandHandler(
        IFileStorageService fileStorageService,
        IApplicationDbContext context,
        ICacheService cacheService)
    {
        _fileStorageService = fileStorageService;
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<Result<ImageUploadResponseDto>> Handle(UploadProductImageCommand request, CancellationToken cancellationToken)
    {
        if (request.FileStream == null)
        {
            return Result.Failure<ImageUploadResponseDto>(Error.Validation("Image.Empty", "Uploaded file stream cannot be null."));
        }

        // 1. Compress image & upload to storage (Supabase / Local)
        var uploadResult = await _fileStorageService.CompressAndUploadImageAsync(
            request.FileStream,
            request.FileName,
            request.ContentType,
            cancellationToken);

        Guid? productImageId = null;

        // 2. If ProductId was specified, persist into Database
        if (request.ProductId.HasValue && request.ProductId.Value != Guid.Empty)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == request.ProductId.Value, cancellationToken);

            if (product == null)
            {
                return Result.Failure<ImageUploadResponseDto>(
                    Error.NotFound("Product.NotFound", $"Product with ID {request.ProductId.Value} not found"));
            }

            if (request.IsPrimary)
            {
                foreach (var img in product.Images)
                {
                    img.IsPrimary = false;
                }
            }

            var productImage = new ProductImage
            {
                ProductId = product.Id,
                ImageUrl = uploadResult.Url,
                AltText = request.AltText ?? product.Name,
                DisplayOrder = product.Images.Count,
                IsPrimary = request.IsPrimary || product.Images.Count == 0
            };

            _context.ProductImages.Add(productImage);
            await _context.SaveChangesAsync(cancellationToken);
            productImageId = productImage.Id;

            // Invalidate product catalog caches
            await _cacheService.RemoveAsync($"product:{product.Id}", cancellationToken);
            await _cacheService.RemoveAsync("catalog:products:all", cancellationToken);
        }

        return Result.Success(new ImageUploadResponseDto(
            Url: uploadResult.Url,
            OriginalSizeBytes: uploadResult.OriginalSizeBytes,
            CompressedSizeBytes: uploadResult.CompressedSizeBytes,
            SavingsPercentage: uploadResult.SavingsPercentage,
            Width: uploadResult.Width,
            Height: uploadResult.Height,
            StorageProvider: uploadResult.StorageProvider,
            ProductImageId: productImageId
        ));
    }
}

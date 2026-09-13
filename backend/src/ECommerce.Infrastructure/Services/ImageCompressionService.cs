using ECommerce.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace ECommerce.Infrastructure.Services;

/// <summary>
/// High-efficiency image compression service using SixLabors.ImageSharp.
/// Resizes images proportionally, strips metadata, and re-encodes to modern WebP
/// to dramatically reduce storage and bandwidth consumption (typically 70-90% savings).
/// </summary>
public class ImageCompressionService : IImageCompressionService
{
    private readonly ILogger<ImageCompressionService> _logger;

    public ImageCompressionService(ILogger<ImageCompressionService> logger)
    {
        _logger = logger;
    }

    public async Task<CompressedImageResult> CompressImageAsync(
        Stream inputStream,
        string originalFileName,
        int maxWidth = 1200,
        int maxHeight = 1200,
        int quality = 80,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(inputStream);

        if (inputStream.CanSeek)
        {
            inputStream.Seek(0, SeekOrigin.Begin);
        }

        long originalSize = inputStream.CanSeek ? inputStream.Length : 0;

        using var image = await Image.LoadAsync(inputStream, cancellationToken);
        int originalWidth = image.Width;
        int originalHeight = image.Height;

        // 1. Proportional resizing if dimensions exceed bounds
        if (image.Width > maxWidth || image.Height > maxHeight)
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(maxWidth, maxHeight),
                Mode = ResizeMode.Max,
                Sampler = KnownResamplers.Lanczos3
            }));

            _logger.LogDebug("[ImageCompression] Resized {FileName} from {OrigW}x{OrigH} to {NewW}x{NewH}",
                originalFileName, originalWidth, originalHeight, image.Width, image.Height);
        }

        // 2. Strip unnecessary metadata (EXIF, ICC, XMP) for size reduction and privacy
        image.Metadata.ExifProfile = null;
        image.Metadata.IccProfile = null;
        image.Metadata.XmpProfile = null;

        // 3. Encode to WebP format
        var encoder = new WebpEncoder
        {
            Quality = Math.Clamp(quality, 10, 100)
        };

        using var memoryStream = new MemoryStream();
        await image.SaveAsync(memoryStream, encoder, cancellationToken);
        byte[] compressedData = memoryStream.ToArray();
        long compressedSize = compressedData.Length;

        if (originalSize == 0)
        {
            originalSize = compressedSize;
        }

        double savings = originalSize > 0
            ? Math.Round((1.0 - ((double)compressedSize / originalSize)) * 100.0, 1)
            : 0.0;

        _logger.LogInformation(
            "[ImageCompression] Compressed '{FileName}': {OrigBytes:N0} B -> {CompBytes:N0} B ({Savings}% saved) | {W}x{H} WebP",
            originalFileName, originalSize, compressedSize, savings, image.Width, image.Height);

        return new CompressedImageResult(
            Data: compressedData,
            ContentType: "image/webp",
            FileExtension: ".webp",
            OriginalSizeBytes: originalSize,
            CompressedSizeBytes: compressedSize,
            SavingsPercentage: Math.Max(0.0, savings),
            Width: image.Width,
            Height: image.Height
        );
    }
}

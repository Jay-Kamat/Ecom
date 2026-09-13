using ECommerce.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace ECommerce.UnitTests.Services;

public class ImageCompressionServiceTests
{
    private readonly ImageCompressionService _compressionService = new(NullLogger<ImageCompressionService>.Instance);

    [Fact]
    public async Task CompressImageAsync_Should_ResizeAndEncodeToWebP()
    {
        // Arrange: create a test 1600x1200 PNG image
        using var testImage = new Image<Rgba32>(1600, 1200);
        using var stream = new MemoryStream();
        await testImage.SaveAsync(stream, new PngEncoder());
        stream.Seek(0, SeekOrigin.Begin);

        // Act
        var result = await _compressionService.CompressImageAsync(
            stream,
            "test-product.png",
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 80);

        // Assert
        result.Should().NotBeNull();
        result.ContentType.Should().Be("image/webp");
        result.FileExtension.Should().Be(".webp");
        result.Width.Should().Be(1200);
        result.Height.Should().Be(900); // Proportional aspect ratio
        result.Data.Should().NotBeEmpty();

        // Check WebP magic bytes: RIFF .... WEBP
        result.Data.Length.Should().BeGreaterThan(12);
        result.Data[0].Should().Be(0x52); // 'R'
        result.Data[1].Should().Be(0x49); // 'I'
        result.Data[2].Should().Be(0x46); // 'F'
        result.Data[3].Should().Be(0x46); // 'F'
        result.Data[8].Should().Be(0x57); // 'W'
        result.Data[9].Should().Be(0x45); // 'E'
        result.Data[10].Should().Be(0x42); // 'B'
        result.Data[11].Should().Be(0x50); // 'P'
    }

    [Fact]
    public async Task CompressImageAsync_SmallImage_Should_NotUpscale()
    {
        // Arrange: create a small 400x300 image
        using var testImage = new Image<Rgba32>(400, 300);
        using var stream = new MemoryStream();
        await testImage.SaveAsync(stream, new PngEncoder());
        stream.Seek(0, SeekOrigin.Begin);

        // Act
        var result = await _compressionService.CompressImageAsync(
            stream,
            "thumbnail.png",
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 80);

        // Assert
        result.Width.Should().Be(400);
        result.Height.Should().Be(300);
        result.ContentType.Should().Be("image/webp");
    }
}

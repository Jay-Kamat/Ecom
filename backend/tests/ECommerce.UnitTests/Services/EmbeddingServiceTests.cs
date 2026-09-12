using ECommerce.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ECommerce.UnitTests.Services;

public class EmbeddingServiceTests
{
    private readonly LocalEmbeddingService _embeddingService = new(NullLogger<LocalEmbeddingService>.Instance);

    [Fact]
    public async Task GenerateEmbedding_Should_Return384Dimensions()
    {
        // Act
        var embedding = await _embeddingService.GenerateEmbeddingAsync("Smartphone with 5G OLED display and long battery life");

        // Assert
        embedding.Should().NotBeNull();
        embedding.Length.Should().Be(384);
    }

    [Fact]
    public async Task GenerateEmbedding_Should_BeDeterministic()
    {
        // Arrange
        const string text = "Wireless noise-cancelling headphones";

        // Act
        var embedding1 = await _embeddingService.GenerateEmbeddingAsync(text);
        var embedding2 = await _embeddingService.GenerateEmbeddingAsync(text);

        // Assert
        embedding1.Should().Equal(embedding2);
    }

    [Fact]
    public async Task GenerateEmbedding_EmptyText_Should_ReturnZeroVector()
    {
        // Act
        var embedding = await _embeddingService.GenerateEmbeddingAsync("");

        // Assert
        embedding.Length.Should().Be(384);
        embedding.Should().AllBeEquivalentTo(0f);
    }
}

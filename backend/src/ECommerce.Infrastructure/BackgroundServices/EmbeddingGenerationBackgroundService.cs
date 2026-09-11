using System.Threading.Channels;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Domain.Entities;
using ECommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that asynchronously generates embeddings for products.
/// Products are queued via a channel and processed without blocking API requests.
/// </summary>
public class EmbeddingGenerationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EmbeddingGenerationBackgroundService> _logger;
    private readonly Channel<Guid> _channel;

    public static readonly Channel<Guid> EmbeddingQueue = Channel.CreateBounded<Guid>(
        new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });

    public EmbeddingGenerationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<EmbeddingGenerationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _channel = EmbeddingQueue;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[EmbeddingService] Background embedding generator started.");

        await foreach (var productId in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await GenerateEmbeddingForProductAsync(productId, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[EmbeddingService] Failed to generate embedding for Product {ProductId}", productId);
            }
        }
    }

    private async Task GenerateEmbeddingForProductAsync(Guid productId, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var embeddingService = scope.ServiceProvider.GetRequiredService<IEmbeddingService>();

        var product = await context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

        if (product == null)
        {
            _logger.LogWarning("[EmbeddingService] Product {ProductId} not found for embedding generation", productId);
            return;
        }

        // Build rich content string for embedding
        var content = BuildEmbeddingContent(product);
        var embedding = await embeddingService.GenerateEmbeddingAsync(content, cancellationToken);

        // Upsert embedding
        var existing = await context.ProductEmbeddings
            .FirstOrDefaultAsync(pe => pe.ProductId == productId, cancellationToken);

        if (existing != null)
        {
            existing.Content = content;
            existing.Embedding = embedding;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            context.ProductEmbeddings.Add(new ProductEmbedding
            {
                ProductId = productId,
                Content = content,
                Embedding = embedding,
                Model = "local-384d"
            });
        }

        await context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("[EmbeddingService] Generated embedding for Product {ProductId} ({Name})", productId, product.Name);
    }

    private static string BuildEmbeddingContent(Domain.Entities.Product product)
    {
        return string.Join(" ",
            product.Name,
            product.Category?.Name ?? string.Empty,
            product.Brand?.Name ?? string.Empty,
            product.ShortDescription,
            product.Description.Length > 500
                ? product.Description[..500]
                : product.Description,
            $"Price {product.Price}",
            product.IsFeatured ? "featured bestseller" : string.Empty
        ).Trim();
    }
}

/// <summary>Helper to queue a product for embedding generation.</summary>
public static class EmbeddingQueueHelper
{
    public static void QueueProduct(Guid productId)
    {
        EmbeddingGenerationBackgroundService.EmbeddingQueue.Writer.TryWrite(productId);
    }
}

using ECommerce.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Services;

/// <summary>
/// Semantic text embedding service using a deterministic cosine-normalized
/// feature extractor over a fixed vocabulary — no cloud dependency needed.
/// For production: swap with OpenAI, Azure OpenAI, or any ONNX model.
/// </summary>
public class LocalEmbeddingService : IEmbeddingService
{
    private const int Dimensions = 384;
    private readonly ILogger<LocalEmbeddingService> _logger;

    // Core vocabulary categories with semantic weight buckets
    private static readonly Dictionary<string, int> _semanticBuckets = new(StringComparer.OrdinalIgnoreCase)
    {
        // Electronics
        { "phone", 0 }, { "smartphone", 0 }, { "mobile", 0 }, { "iphone", 0 }, { "android", 0 },
        { "samsung", 1 }, { "apple", 1 }, { "oneplus", 1 }, { "xiaomi", 1 }, { "realme", 1 },
        { "laptop", 2 }, { "computer", 2 }, { "notebook", 2 }, { "macbook", 2 }, { "dell", 2 },
        { "tablet", 3 }, { "ipad", 3 }, { "screen", 3 }, { "display", 3 }, { "monitor", 3 },
        { "earphone", 4 }, { "headphone", 4 }, { "wireless", 4 }, { "bluetooth", 4 }, { "audio", 4 },
        // Footwear
        { "shoe", 10 }, { "shoes", 10 }, { "sneaker", 10 }, { "boot", 10 }, { "sandal", 10 },
        { "running", 11 }, { "sport", 11 }, { "athletic", 11 }, { "training", 11 }, { "gym", 11 },
        { "comfortable", 12 }, { "cushion", 12 }, { "support", 12 }, { "lightweight", 12 },
        // Clothing
        { "shirt", 20 }, { "tshirt", 20 }, { "top", 20 }, { "jacket", 20 }, { "hoodie", 20 },
        { "jeans", 21 }, { "pant", 21 }, { "trouser", 21 }, { "shorts", 21 }, { "skirt", 21 },
        // Camera
        { "camera", 30 }, { "photo", 30 }, { "picture", 30 }, { "lens", 30 }, { "dslr", 30 },
        { "mirrorless", 31 }, { "zoom", 31 }, { "megapixel", 31 }, { "photography", 31 },
        // Home
        { "furniture", 40 }, { "chair", 40 }, { "table", 40 }, { "sofa", 40 }, { "bed", 40 },
        { "appliance", 41 }, { "kitchen", 41 }, { "refrigerator", 41 }, { "washing", 41 },
        // Price/Value
        { "budget", 50 }, { "affordable", 50 }, { "cheap", 50 }, { "value", 50 },
        { "premium", 51 }, { "luxury", 51 }, { "high-end", 51 }, { "best", 51 }, { "prime", 51 },
        // Color
        { "black", 60 }, { "white", 61 }, { "blue", 62 }, { "red", 63 }, { "green", 64 },
        { "gray", 65 }, { "gold", 66 }, { "silver", 67 }, { "pink", 68 }, { "yellow", 69 },
    };

    public LocalEmbeddingService(ILogger<LocalEmbeddingService> logger)
    {
        _logger = logger;
    }

    public Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
    {
        var embedding = new float[Dimensions];

        if (string.IsNullOrWhiteSpace(text))
            return Task.FromResult(embedding);

        var words = text.ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '!', '?', '-', '_', '/', '\\', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries);

        // Feature 1: Semantic bucket activations (dims 0-79)
        foreach (var word in words)
        {
            if (_semanticBuckets.TryGetValue(word, out var bucket))
            {
                var startDim = bucket;
                // Spread activation across 5 dims per bucket
                for (int i = 0; i < 5 && startDim + i < 80; i++)
                    embedding[startDim + i] += 1.0f / (i + 1);
            }
        }

        // Feature 2: Character n-gram hashing (dims 80-255)
        for (int i = 0; i < words.Length; i++)
        {
            var word = words[i];
            for (int j = 0; j < word.Length - 1; j++)
            {
                var bigram = word.Substring(j, Math.Min(2, word.Length - j));
                var hash = Math.Abs(bigram.GetHashCode()) % 176;
                embedding[80 + hash] += 1.0f / (words.Length + 1);
            }
        }

        // Feature 3: Word frequency distribution (dims 256-319)
        var wordCounts = words.GroupBy(w => w).ToDictionary(g => g.Key, g => g.Count());
        foreach (var (word, count) in wordCounts)
        {
            var dim = 256 + Math.Abs(word.GetHashCode() % 64);
            embedding[dim] += (float)count / words.Length;
        }

        // Feature 4: Text length feature (dim 320-335)
        embedding[320] = Math.Min(words.Length / 50.0f, 1.0f);
        embedding[321] = Math.Min(text.Length / 500.0f, 1.0f);

        // Feature 5: Positional importance (dims 336-383)
        for (int i = 0; i < Math.Min(words.Length, 16); i++)
        {
            var word = words[i];
            var hash = Math.Abs(word.GetHashCode()) % 48;
            embedding[336 + hash] += 1.0f / (i + 1);
        }

        // L2 Normalize to unit vector (cosine similarity ready)
        var magnitude = Math.Sqrt(embedding.Sum(v => v * v));
        if (magnitude > 0)
        {
            for (int i = 0; i < Dimensions; i++)
                embedding[i] = (float)(embedding[i] / magnitude);
        }

        return Task.FromResult(embedding);
    }
}

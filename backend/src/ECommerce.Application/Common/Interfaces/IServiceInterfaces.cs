using ECommerce.Application.DTOs;
using ECommerce.Domain.Entities;

namespace ECommerce.Application.Common.Interfaces;

public interface IEmbeddingService
{
    Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default);
}

public interface IProductVectorSearchService
{
    Task<IReadOnlyList<ProductSearchResultDto>> SearchAsync(
        string query,
        int limit = 10,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSearchResultDto>> HybridSearchAsync(
        string query,
        Guid? categoryId = null,
        Guid? brandId = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        bool inStockOnly = false,
        int limit = 10,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSearchResultDto>> GetSimilarProductsAsync(
        Guid productId,
        int limit = 6,
        CancellationToken cancellationToken = default);
}

public record CompressedImageResult(
    byte[] Data,
    string ContentType,
    string FileExtension,
    long OriginalSizeBytes,
    long CompressedSizeBytes,
    double SavingsPercentage,
    int Width,
    int Height
);

public record ImageUploadResult(
    string Url,
    long OriginalSizeBytes,
    long CompressedSizeBytes,
    double SavingsPercentage,
    int Width,
    int Height,
    string StorageProvider
);

public interface IImageCompressionService
{
    Task<CompressedImageResult> CompressImageAsync(
        Stream inputStream,
        string originalFileName,
        int maxWidth = 1200,
        int maxHeight = 1200,
        int quality = 80,
        CancellationToken cancellationToken = default);
}

public interface IFileStorageService
{
    Task<string> UploadFileAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<ImageUploadResult> CompressAndUploadImageAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IPasswordHasher
{
    string HashPassword(string password, out string salt);
    bool VerifyPassword(string password, string hash, string salt);
}

public interface ITokenService
{
    string GenerateJwtToken(User user, IEnumerable<string> roles);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}

public interface IDateTimeService
{
    DateTime UtcNow { get; }
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
}

public interface IPaymentService
{
    Task<(bool Success, string TransactionId, string Message)> ProcessPaymentAsync(
        decimal amount,
        string paymentMethod,
        Guid orderId,
        CancellationToken cancellationToken = default);
}

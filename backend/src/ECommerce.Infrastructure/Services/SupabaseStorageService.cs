using System.Net.Http.Headers;
using System.Text.Json;
using ECommerce.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Services;

/// <summary>
/// Supabase Storage provider for product images.
/// Automatically compresses images to WebP format before uploading to Supabase Storage,
/// and returns the public CDN URL to save in the database.
/// </summary>
public class SupabaseStorageService : IFileStorageService
{
    private readonly HttpClient _httpClient;
    private readonly IImageCompressionService _compressionService;
    private readonly ILogger<SupabaseStorageService> _logger;
    private readonly string _supabaseUrl;
    private readonly string _apiKey;
    private readonly string _bucketName;
    private readonly int _maxDimension;
    private readonly int _quality;

    public SupabaseStorageService(
        HttpClient httpClient,
        IImageCompressionService compressionService,
        IConfiguration configuration,
        ILogger<SupabaseStorageService> logger)
    {
        _httpClient = httpClient;
        _compressionService = compressionService;
        _logger = logger;

        _supabaseUrl = (configuration["Supabase:Url"] ?? "https://rdyucasfiycvizpatmcs.supabase.co").TrimEnd('/');
        _apiKey = configuration["Supabase:ApiKey"] 
            ?? configuration["Supabase:PublishableKey"]
            ?? configuration["Supabase:AnonKey"] 
            ?? string.Empty;
        _bucketName = configuration["Supabase:BucketName"] ?? "product-images";
        _maxDimension = int.TryParse(configuration["Supabase:MaxDimension"], out var dim) ? dim : 1200;
        _quality = int.TryParse(configuration["Supabase:Quality"], out var q) ? q : 80;
    }

    public async Task<ImageUploadResult> CompressAndUploadImageAsync(
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(stream);

        // 1. Compress image to modern WebP format
        var compressed = await _compressionService.CompressImageAsync(
            stream,
            fileName,
            maxWidth: _maxDimension,
            maxHeight: _maxDimension,
            quality: _quality,
            cancellationToken: cancellationToken);

        // 2. Build unique object path: products/YYYYMMDD_GUID.webp
        var safeFileName = $"products/{DateTime.UtcNow:yyyyMMdd}_{Guid.NewGuid():N}.webp";

        // 3. Upload to Supabase Storage REST endpoint
        var uploadUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{safeFileName}";

        using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
        request.Headers.Add("apikey", _apiKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Headers.Add("x-upsert", "true");

        request.Content = new ByteArrayContent(compressed.Data);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("image/webp");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("[SupabaseStorage] Failed to upload image to {Url}. Status: {StatusCode}, Error: {Error}",
                uploadUrl, response.StatusCode, errorContent);
            throw new InvalidOperationException($"Supabase storage upload failed ({response.StatusCode}): {errorContent}");
        }

        // 4. Construct public CDN URL
        var publicUrl = $"{_supabaseUrl}/storage/v1/object/public/{_bucketName}/{safeFileName}";

        _logger.LogInformation("[SupabaseStorage] Successfully stored image: {PublicUrl} (Size: {Compressed:N0} bytes, Saved: {Savings}%)",
            publicUrl, compressed.CompressedSizeBytes, compressed.SavingsPercentage);

        return new ImageUploadResult(
            Url: publicUrl,
            OriginalSizeBytes: compressed.OriginalSizeBytes,
            CompressedSizeBytes: compressed.CompressedSizeBytes,
            SavingsPercentage: compressed.SavingsPercentage,
            Width: compressed.Width,
            Height: compressed.Height,
            StorageProvider: "Supabase"
        );
    }

    public async Task<string> UploadFileAsync(
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        // Route through compression if it's an image
        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
            LocalFileStorageService.IsValidImageHeader(new byte[16], 0, Path.GetExtension(fileName)))
        {
            var result = await CompressAndUploadImageAsync(stream, fileName, contentType, cancellationToken);
            return result.Url;
        }

        // Direct upload for non-compressible assets
        var ext = Path.GetExtension(fileName);
        var safeFileName = $"assets/{DateTime.UtcNow:yyyyMMdd}_{Guid.NewGuid():N}{ext}";
        var uploadUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{safeFileName}";

        using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
        request.Headers.Add("apikey", _apiKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Headers.Add("x-upsert", "true");

        if (stream.CanSeek) stream.Seek(0, SeekOrigin.Begin);
        request.Content = new StreamContent(stream);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Supabase storage upload failed ({response.StatusCode}): {errorContent}");
        }

        return $"{_supabaseUrl}/storage/v1/object/public/{_bucketName}/{safeFileName}";
    }

    public async Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileUrl) || !fileUrl.Contains(_bucketName, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            // Extract relative object path from public URL
            // e.g. https://xyz.supabase.co/storage/v1/object/public/product-images/products/foo.webp -> products/foo.webp
            var marker = $"/storage/v1/object/public/{_bucketName}/";
            var idx = fileUrl.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (idx == -1) return false;

            var objectPath = fileUrl[(idx + marker.Length)..];

            var deleteUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{objectPath}";
            using var request = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
            request.Headers.Add("apikey", _apiKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SupabaseStorage] Failed to delete file {FileUrl}", fileUrl);
            return false;
        }
    }
}

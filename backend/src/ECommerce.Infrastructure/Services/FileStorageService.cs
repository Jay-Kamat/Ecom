using ECommerce.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Services;

/// <summary>
/// Hardened file storage service with magic byte validation, extension whitelisting,
/// size enforcement, and path traversal defense.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB max
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    private readonly ILogger<LocalFileStorageService> _logger;
    private readonly string _storagePath;
    private readonly string _baseUrl;

    public LocalFileStorageService(ILogger<LocalFileStorageService> logger)
    {
        _logger = logger;
        _storagePath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));
        _baseUrl = "/uploads";
        Directory.CreateDirectory(_storagePath);
    }

    public async Task<string> UploadFileAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        // 1. Defend against path traversal via filename
        var safeOriginalName = Path.GetFileName(fileName);
        var ext = Path.GetExtension(safeOriginalName).ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
        {
            throw new ArgumentException($"File extension '{ext}' is not permitted. Allowed: {string.Join(", ", AllowedExtensions)}");
        }

        // 2. Enforce file size limit
        if (stream.CanSeek && stream.Length > MaxFileSizeBytes)
        {
            throw new ArgumentException($"File size exceeds the maximum permitted limit of {MaxFileSizeBytes / (1024 * 1024)} MB.");
        }

        // 3. Inspect binary magic bytes (anti-spoofing)
        var headerBuffer = new byte[16];
        var bytesRead = await stream.ReadAsync(headerBuffer.AsMemory(0, headerBuffer.Length), cancellationToken);

        if (!IsValidImageHeader(headerBuffer, bytesRead, ext))
        {
            _logger.LogWarning("[FileStorage] Rejected file upload due to invalid/mismatched magic bytes for {FileName}", safeOriginalName);
            throw new InvalidOperationException("The uploaded file content does not match its declared image format.");
        }

        // Reset stream position after reading magic bytes
        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }

        // 4. Generate random UUID filename
        var safeName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.GetFullPath(Path.Combine(_storagePath, safeName));

        // Path traversal sanity assertion
        if (!filePath.StartsWith(_storagePath, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Attempted path traversal detected in file storage.");
        }

        await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fileStream, cancellationToken);

        _logger.LogInformation("[FileStorage] Uploaded sanitized file: {FileName} -> {Path}", safeOriginalName, filePath);
        return $"{_baseUrl}/{safeName}";
    }

    public Task<bool> DeleteFileAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            // Sanitize file name to prevent path traversal in delete operations
            var fileName = Path.GetFileName(fileUrl);
            if (string.IsNullOrWhiteSpace(fileName)) return Task.FromResult(false);

            var filePath = Path.GetFullPath(Path.Combine(_storagePath, fileName));

            // Verify the file path strictly resides within the storage root
            if (!filePath.StartsWith(_storagePath, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("[FileStorage] Path traversal attempt in DeleteFileAsync: {FileUrl}", fileUrl);
                return Task.FromResult(false);
            }

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return Task.FromResult(true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[FileStorage] Failed to delete file: {FileUrl}", fileUrl);
        }

        return Task.FromResult(false);
    }

    public static bool IsValidImageHeader(byte[] header, int bytesRead, string extension)
    {
        if (bytesRead < 4) return false;

        // JPEG: FF D8 FF
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return extension is ".jpg" or ".jpeg";

        // PNG: 89 50 4E 47
        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47)
            return extension is ".png";

        // GIF: 47 49 46 38
        if (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38)
            return extension is ".gif";

        // WebP: RIFF .... WEBP
        if (bytesRead >= 12 &&
            header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
            header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
            return extension is ".webp";

        return false;
    }
}

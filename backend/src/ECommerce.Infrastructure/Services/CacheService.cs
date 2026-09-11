using System.Text.Json;
using ECommerce.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace ECommerce.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<CacheService> _logger;
    private readonly bool _redisAvailable;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public CacheService(
        IMemoryCache memoryCache,
        ILogger<CacheService> logger,
        IConnectionMultiplexer? redis = null)
    {
        _memoryCache = memoryCache;
        _logger = logger;
        _redis = redis;
        _redisAvailable = redis?.IsConnected == true;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (_redisAvailable)
        {
            try
            {
                var db = _redis!.GetDatabase();
                var value = await db.StringGetAsync(key);
                if (value.HasValue)
                    return JsonSerializer.Deserialize<T>(value.ToString(), JsonOpts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Cache] Redis GET failed for key {Key}, falling back to memory cache", key);
            }
        }

        if (_memoryCache.TryGetValue(key, out T? cached))
            return cached;

        return default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var expiry = expiration ?? TimeSpan.FromMinutes(10);

        if (_redisAvailable)
        {
            try
            {
                var db = _redis!.GetDatabase();
                var json = JsonSerializer.Serialize(value, JsonOpts);
                await db.StringSetAsync(key, json, expiry);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Cache] Redis SET failed for key {Key}, falling back to memory cache", key);
            }
        }

        _memoryCache.Set(key, value, expiry);
        await Task.CompletedTask;
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_redisAvailable)
        {
            try
            {
                var db = _redis!.GetDatabase();
                await db.KeyDeleteAsync(key);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Cache] Redis DELETE failed for key {Key}", key);
            }
        }

        _memoryCache.Remove(key);
        await Task.CompletedTask;
    }
}

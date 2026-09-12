using System.Text;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Infrastructure.BackgroundServices;
using ECommerce.Infrastructure.Persistence;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

namespace ECommerce.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. EF Core + PostgreSQL
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("PostgreSQL")
                    ?? "Host=localhost;Port=5432;Database=novamart_db;Username=postgres;Password=root;",
                npgsql =>
                {
                    npgsql.UseVector();
                    npgsql.EnableRetryOnFailure(3);
                    npgsql.CommandTimeout(30);
                });
        });

        // 2. Register IApplicationDbContext
        services.AddScoped<IApplicationDbContext>(sp =>
            sp.GetRequiredService<ApplicationDbContext>());

        // 3. Memory Cache (always available)
        services.AddMemoryCache();

        // 4. Redis (optional – gracefully falls back to in-memory)
        var redisConnection = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            try
            {
                var redis = ConnectionMultiplexer.Connect(redisConnection);
                services.AddSingleton<IConnectionMultiplexer>(redis);
            }
            catch
            {
                // Redis not available – CacheService will use in-memory fallback
            }
        }
        services.AddScoped<ICacheService, CacheService>();

        // 5. Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IDateTimeService, DateTimeService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IEmbeddingService, LocalEmbeddingService>();
        services.AddScoped<IProductVectorSearchService, ProductVectorSearchService>();
        services.AddScoped<IAuditLogService, AuditLogService>();

        // 6. Background Services
        services.AddHostedService<EmbeddingGenerationBackgroundService>();

        // 7. JWT Authentication
        var jwtKey = configuration["Jwt:Key"] ?? "NovaMartSuperSecretKey2026WithMinimum256BitsRequiredForHmacSha256!";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "ECommerceApi";
        var jwtAudience = configuration["Jwt:Audience"] ?? "ECommerceClients";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        return services;
    }
}

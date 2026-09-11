using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using NovaMart.Api.Repositories;
using NovaMart.Api.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Core DI Services
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<ITokenService, TokenService>();

// 2. DataStore Registration (MongoDb with automatic In-Memory fallback)
var useMongo = builder.Configuration.GetValue<bool>("UseMongoDb", false);
var mongoConnectionString = builder.Configuration.GetConnectionString("MongoDb") ?? "mongodb://localhost:27017";

if (useMongo)
{
    try
    {
        var client = new MongoClient(mongoConnectionString);
        var pingTask = client.GetDatabase("admin").RunCommandAsync<MongoDB.Bson.BsonDocument>(new MongoDB.Bson.BsonDocument("ping", 1));
        if (pingTask.Wait(2000))
        {
            builder.Services.AddSingleton<IDataStore, MongoDataStore>();
            Console.WriteLine("[NovaMart] Connected to MongoDB database successfully.");
        }
        else
        {
            throw new TimeoutException("MongoDB ping timed out.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[NovaMart] MongoDB not reachable ({ex.Message}). Falling back to Persistent InMemoryDataStore.");
        builder.Services.AddSingleton<IDataStore, InMemoryDataStore>();
    }
}
else
{
    Console.WriteLine("[NovaMart] Using high-performance Persistent InMemoryDataStore (store_state.json).");
    builder.Services.AddSingleton<IDataStore, InMemoryDataStore>();
}

// 3. Controllers & JSON Formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// 4. OpenAPI Specification
builder.Services.AddOpenApi();

// 5. CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("NovaMartCorsPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 6. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "NovaMartSuperSecretKey2026WithMinimum256BitsRequiredForHmacSha256!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "NovaMartApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "NovaMartClients";

builder.Services.AddAuthentication(options =>
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

builder.Services.AddAuthorization();

var app = builder.Build();

// 7. Middleware Pipeline
app.UseCors("NovaMartCorsPolicy");

// OpenAPI JSON endpoint and modern interactive API documentation
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("NovaMart E-Commerce API Documentation")
           .WithTheme(ScalarTheme.Moon);
});

app.UseAuthentication();
app.UseAuthorization();

// Friendly endpoints
app.MapGet("/", () => Results.Redirect("/scalar/v1"));
app.MapGet("/swagger", () => Results.Redirect("/scalar/v1"));
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "NovaMart.Api",
    timestamp = DateTime.UtcNow,
    documentation = "/scalar/v1",
    engine = ".NET 10.0 ASP.NET Core"
}));

app.MapControllers();

app.Run();

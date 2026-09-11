using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NovaMart.Application;
using NovaMart.Infrastructure;
using NovaMart.Infrastructure.Persistence;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Clean Architecture Layer Dependencies
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Controllers & JSON Formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// 3. OpenAPI Specification
builder.Services.AddOpenApi();

// 4. CORS Policy
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

// 5. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "NovaMartSuperSecureSecretKey2026WithMinimum256BitsRequiredForHmacSha256!";
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

// 6. Database Auto-Migration & Seeding
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        Console.WriteLine("[NovaMart] Initializing PostgreSQL database schema (EnsureCreatedAsync)...");
        await db.Database.EnsureCreatedAsync();
        await DataSeeder.SeedAsync(db, services);
        Console.WriteLine("[NovaMart] PostgreSQL database is ready and verified.");
    }
    catch (Exception ex)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"[NovaMart Error] Failed to initialize PostgreSQL database: {ex.Message}");
        Console.ResetColor();
    }
}

// 7. Middleware Pipeline
app.UseCors("NovaMartCorsPolicy");

app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("NovaMart Clean Architecture E-Commerce API (PostgreSQL + CQRS)")
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
    architecture = "Clean Architecture + CQRS (MediatR)",
    database = "PostgreSQL",
    timestamp = DateTime.UtcNow,
    documentation = "/scalar/v1",
    engine = ".NET 10.0 ASP.NET Core"
}));

app.MapControllers();

app.Run();

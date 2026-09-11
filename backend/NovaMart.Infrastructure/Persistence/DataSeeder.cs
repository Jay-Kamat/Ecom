using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NovaMart.Application.Common.Interfaces;
using NovaMart.Domain.Entities;

namespace NovaMart.Infrastructure.Persistence;

public static class DataSeeder
{
    private class SeedDataSnapshot
    {
        public List<Product> Products { get; set; } = new();
        public List<User> Users { get; set; } = new();
        public List<Order> Orders { get; set; } = new();
        public List<Coupon> Coupons { get; set; } = new();
        public List<SavedAddress> Addresses { get; set; } = new();
    }

    public static async Task SeedAsync(ApplicationDbContext context, IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetService<ILogger<ApplicationDbContext>>();
        var hasher = serviceProvider.GetRequiredService<IPasswordHasher>();

        // 1. Seed Products if empty
        if (!await context.Products.AnyAsync())
        {
            logger?.LogInformation("[NovaMart PostgreSQL] Seeding initial products...");
            var snapshot = TryLoadSnapshot();
            if (snapshot != null && snapshot.Products.Count > 0)
            {
                await context.Products.AddRangeAsync(snapshot.Products);
            }
        }

        // 2. Seed Users if empty or missing admin
        var adminEmail = "admin@novamart.in";
        if (!await context.Users.AnyAsync(u => u.Email == adminEmail))
        {
            logger?.LogInformation("[NovaMart PostgreSQL] Seeding administrative and demo accounts...");
            var (adminHash, adminSalt) = hasher.HashPassword("Admin@123");
            var (userHash, userSalt) = hasher.HashPassword("Customer@123");

            var users = new List<User>
            {
                new()
                {
                    Id = "usr-admin-1",
                    Name = "NovaMart Administrator",
                    Email = adminEmail,
                    Phone = "+91 98765 43211",
                    PasswordHash = adminHash,
                    PasswordSalt = adminSalt,
                    Role = "Admin",
                    Status = "Active",
                    OrdersCount = 0,
                    JoinedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = "usr-demo-1",
                    Name = "Arun Patel",
                    Email = "arun.patel@gmail.com",
                    Phone = "+91 98765 01234",
                    PasswordHash = userHash,
                    PasswordSalt = userSalt,
                    Role = "Customer",
                    Status = "Active",
                    OrdersCount = 1,
                    JoinedAt = DateTime.UtcNow
                }
            };
            await context.Users.AddRangeAsync(users);
        }

        // 3. Seed Coupons if empty
        if (!await context.Coupons.AnyAsync())
        {
            logger?.LogInformation("[NovaMart PostgreSQL] Seeding default coupons...");
            var coupons = new List<Coupon>
            {
                new() { Code = "WELCOME100", DiscountFlat = 100, MinCart = 500, Description = "₹100 flat off on orders above ₹500", UsageCount = 120, Validity = "31 Dec 2026" },
                new() { Code = "NOVA20", DiscountPercent = 20, MinCart = 0, Description = "20% off on your entire cart", UsageCount = 142, Validity = "31 Dec 2026" },
                new() { Code = "FESTIVE500", DiscountFlat = 500, MinCart = 2000, Description = "₹500 off on festive orders above ₹2000", UsageCount = 65, Validity = "15 Oct 2026" },
                new() { Code = "FIRST100", DiscountFlat = 100, MinCart = 500, Description = "₹100 off on first purchase", UsageCount = 89, Validity = "30 Nov 2026" }
            };
            await context.Coupons.AddRangeAsync(coupons);
        }

        // 4. Seed Saved Addresses if empty
        if (!await context.SavedAddresses.AnyAsync())
        {
            logger?.LogInformation("[NovaMart PostgreSQL] Seeding default saved addresses...");
            var addresses = new List<SavedAddress>
            {
                new()
                {
                    Id = "addr-1",
                    UserEmail = "arun.patel@gmail.com",
                    Tag = "Home",
                    Name = "Arun Patel",
                    Phone = "+91 98765 01234",
                    Street = "Flat 302, Skyline Residency, Koramangala 4th Block",
                    City = "Bengaluru",
                    State = "Karnataka",
                    Pin = "560034",
                    IsDefault = true
                },
                new()
                {
                    Id = "addr-2",
                    UserEmail = "arun.patel@gmail.com",
                    Tag = "Work",
                    Name = "Arun Patel",
                    Phone = "+91 98765 01234",
                    Street = "Indiranagar 100ft Road, Stage 2",
                    City = "Bengaluru",
                    State = "Karnataka",
                    Pin = "560038",
                    IsDefault = false
                }
            };
            await context.SavedAddresses.AddRangeAsync(addresses);
        }

        await context.SaveChangesAsync();
        logger?.LogInformation("[NovaMart PostgreSQL] Data seeding completed successfully.");
    }

    private static SeedDataSnapshot? TryLoadSnapshot()
    {
        var candidatePaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Persistence", "seed_data.json"),
            Path.Combine(AppContext.BaseDirectory, "seed_data.json"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "NovaMart.Infrastructure", "Persistence", "seed_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "Persistence", "seed_data.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "seed_data.json")
        };

        foreach (var path in candidatePaths)
        {
            if (File.Exists(path))
            {
                try
                {
                    var json = File.ReadAllText(path);
                    var snapshot = JsonSerializer.Deserialize<SeedDataSnapshot>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    if (snapshot != null && snapshot.Products.Count > 0)
                        return snapshot;
                }
                catch { }
            }
        }

        return null;
    }
}

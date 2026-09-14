using System.Text;
using System.Text.Json;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Enums;
using ECommerce.Infrastructure.BackgroundServices;
using ECommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Persistence;

/// <summary>
/// Seeds the database with realistic AaryaMart-compatible demo data.
/// Runs at startup; idempotent – only seeds if no data exists.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher hasher)
    {
        // Only seed if DB is empty
        if (await context.Users.AnyAsync()) return;

        Console.WriteLine("[ECommerce] Seeding database with demo data...");

        // 1. Roles
        var adminRole = new Role { Name = "Admin", Description = "Full system access" };
        var customerRole = new Role { Name = "Customer", Description = "Customer access" };
        context.Roles.AddRange(adminRole, customerRole);
        await context.SaveChangesAsync();

        // 2. Users
        var adminHash = hasher.HashPassword("Admin@123", out var adminSalt);
        var adminUser = new User
        {
            FirstName = "Admin",
            LastName = "AaryaMart",
            Email = "admin@aaryamart.in",
            PasswordHash = adminHash,
            PasswordSalt = adminSalt,
            Phone = "+91 99887 76655",
            IsActive = true
        };
        adminUser.UserRoles.Add(new UserRole { User = adminUser, Role = adminRole });

        var customerHash = hasher.HashPassword("Customer@123", out var customerSalt);
        var customerUser = new User
        {
            FirstName = "Arun",
            LastName = "Patel",
            Email = "arun.patel@gmail.com",
            PasswordHash = customerHash,
            PasswordSalt = customerSalt,
            Phone = "+91 98765 43210",
            IsActive = true
        };
        customerUser.UserRoles.Add(new UserRole { User = customerUser, Role = customerRole });
        context.Users.AddRange(adminUser, customerUser);
        await context.SaveChangesAsync();

        // 3. Customers
        var customer1 = new Customer
        {
            UserId = customerUser.Id, User = customerUser,
            FirstName = "Arun", LastName = "Patel",
            Email = "arun.patel@gmail.com", Phone = "+91 98765 43210"
        };
        var customer2 = new Customer
        {
            FirstName = "Pooja", LastName = "Sharma",
            Email = "pooja.sharma@example.com", Phone = "+91 98765 43210"
        };
        var customer3 = new Customer
        {
            FirstName = "Rahul", LastName = "Gupta",
            Email = "rahul.gupta@example.com", Phone = "+91 91234 56789"
        };
        context.Customers.AddRange(customer1, customer2, customer3);
        await context.SaveChangesAsync();

        // 4. Saved Addresses
        context.Addresses.Add(new Address
        {
            CustomerId = customer1.Id, Tag = "Home",
            FullName = "Arun Patel", Phone = "+91 98765 43210",
            Street = "Flat 101, Green Heights, Koramangala",
            City = "Bengaluru", State = "Karnataka", PostalCode = "560034", IsDefault = true
        });
        context.Addresses.Add(new Address
        {
            CustomerId = customer1.Id, Tag = "Work",
            FullName = "Arun Patel", Phone = "+91 98765 43210",
            Street = "Brigade Tech Park, Whitefield",
            City = "Bengaluru", State = "Karnataka", PostalCode = "560066"
        });
        await context.SaveChangesAsync();

        // 5. Categories
        var electronics = new Category { Name = "Electronics", Slug = "electronics", Description = "Electronic gadgets & devices" };
        var smartphones = new Category { Name = "Smartphones", Slug = "smartphones", Description = "Latest smartphones", ParentCategory = electronics };
        var laptops = new Category { Name = "Laptops", Slug = "laptops", Description = "Laptops and notebooks", ParentCategory = electronics };
        var audio = new Category { Name = "Audio", Slug = "audio", Description = "Headphones, earphones and speakers", ParentCategory = electronics };
        var fashion = new Category { Name = "Fashion", Slug = "fashion", Description = "Clothing and accessories" };
        var footwear = new Category { Name = "Footwear", Slug = "footwear", Description = "Shoes, sandals and more", ParentCategory = fashion };
        var home = new Category { Name = "Home & Kitchen", Slug = "home-kitchen", Description = "Home appliances and kitchen essentials" };
        context.Categories.AddRange(electronics, smartphones, laptops, audio, fashion, footwear, home);
        await context.SaveChangesAsync();

        // 6. Brands
        var aaryaTech = new Brand { Name = "AaryaTech", Slug = "aaryatech", Description = "Premium AaryaMart in-house brand" };
        var samsung = new Brand { Name = "Samsung", Slug = "samsung", Description = "Samsung Electronics" };
        var apple = new Brand { Name = "Apple", Slug = "apple", Description = "Apple Inc." };
        var sony = new Brand { Name = "Sony", Slug = "sony", Description = "Sony Corporation" };
        var nike = new Brand { Name = "Nike", Slug = "nike", Description = "Nike Sportswear" };
        var bose = new Brand { Name = "Bose", Slug = "bose", Description = "Bose Audio" };
        context.Brands.AddRange(aaryaTech, samsung, apple, sony, nike, bose);
        await context.SaveChangesAsync();

        // 7. Products
        var products = new List<Product>
        {
            new Product
            {
                Name = "AaryaPro X1 Ultra 5G (Celestial Blue, 256GB)", SKU = "NPRO-X1-256-BLUE",
                Description = "The AaryaPro X1 Ultra is AaryaMart's flagship 5G smartphone, featuring the latest Snapdragon 8 Gen 3 chipset, 12GB RAM, and a stunning 6.8\" AMOLED display. With its triple-camera system boasting a 200MP primary sensor, 12x optical zoom, and 8K video recording, it redefines mobile photography. The 5000mAh battery with 120W HyperCharge technology ensures you stay powered all day.",
                ShortDescription = "Flagship 5G phone with 200MP camera and 120W charging",
                CategoryId = smartphones.Id, BrandId = aaryaTech.Id,
                Price = 64999, Mrp = 74999, DiscountPercentage = 13,
                StockQuantity = 45, Rating = 4.8, RatingCount = 3247, ReviewsCount = 892,
                IsFeatured = true, Badge = "Bestseller", Status = ProductStatus.Active
            },
            new Product
            {
                Name = "Samsung Galaxy S25 Ultra (Phantom Black, 512GB)", SKU = "SAMSUNG-S25U-512-BLK",
                Description = "Samsung Galaxy S25 Ultra with built-in S Pen, 200MP camera, 6.8\" Dynamic AMOLED display, Snapdragon 8 Gen 3, 12GB RAM, and 5000mAh battery with 45W fast charging.",
                ShortDescription = "Premium Samsung flagship with S Pen and 200MP camera",
                CategoryId = smartphones.Id, BrandId = samsung.Id,
                Price = 134999, Mrp = 144999, DiscountPercentage = 7,
                StockQuantity = 22, Rating = 4.7, RatingCount = 1823, ReviewsCount = 456,
                IsFeatured = true, Badge = "Top Rated", Status = ProductStatus.Active
            },
            new Product
            {
                Name = "Apple MacBook Air M3 (Midnight, 16GB/512GB)", SKU = "APPLE-MBA-M3-512-MID",
                Description = "MacBook Air with M3 chip, 16GB unified memory, 512GB SSD, 15.3-inch Liquid Retina display. Up to 18 hours battery life, MagSafe charging, and a fanless design that runs cool and silent.",
                ShortDescription = "Ultra-thin laptop with Apple M3 chip and 18-hour battery",
                CategoryId = laptops.Id, BrandId = apple.Id,
                Price = 134900, Mrp = 144900, DiscountPercentage = 7,
                StockQuantity = 18, Rating = 4.9, RatingCount = 2341, ReviewsCount = 623,
                IsFeatured = true, Badge = "Editor's Choice", Status = ProductStatus.Active
            },
            new Product
            {
                Name = "Sony WH-1000XM5 Wireless Headphones (Black)", SKU = "SONY-WH1000XM5-BLK",
                Description = "Industry-leading noise canceling with Auto NC Optimizer. 30-hour battery with quick charging. Crystal clear hands-free calling with 8 microphones. Multipoint connection to two Bluetooth devices simultaneously.",
                ShortDescription = "Industry-leading noise canceling wireless headphones",
                CategoryId = audio.Id, BrandId = sony.Id,
                Price = 24990, Mrp = 34990, DiscountPercentage = 29,
                StockQuantity = 78, Rating = 4.7, RatingCount = 5621, ReviewsCount = 1823,
                IsFeatured = false, Badge = "Trending Deal", Status = ProductStatus.Active
            },
            new Product
            {
                Name = "Nike Air Max 270 Running Shoes (Black/White, Size 9)", SKU = "NIKE-AM270-BLK-9",
                Description = "Nike Air Max 270 features Nike's biggest heel Air unit yet for a super-soft ride. The breathable engineered mesh upper keeps feet cool while the foam midsole provides added cushioning.",
                ShortDescription = "Comfortable Air Max cushioned running shoes",
                CategoryId = footwear.Id, BrandId = nike.Id,
                Price = 9995, Mrp = 12995, DiscountPercentage = 23,
                StockQuantity = 134, Rating = 4.5, RatingCount = 3892, ReviewsCount = 978,
                IsFeatured = false, Badge = "Popular", Status = ProductStatus.Active
            },
            new Product
            {
                Name = "Bose QuietComfort 45 Wireless Headphones (White Smoke)", SKU = "BOSE-QC45-WHITE",
                Description = "Premium Bose QuietComfort 45 with world-class noise cancellation, 24-hour battery, comfortable over-ear fit, and Aware Mode for staying tuned to your environment when needed.",
                ShortDescription = "Premium noise-canceling headphones with 24-hour battery",
                CategoryId = audio.Id, BrandId = bose.Id,
                Price = 19999, Mrp = 29999, DiscountPercentage = 33,
                StockQuantity = 56, Rating = 4.6, RatingCount = 2456, ReviewsCount = 712,
                IsFeatured = false, Badge = "Trending Deal", Status = ProductStatus.Active
            },
            new Product
            {
                Name = "AaryaTech UltraBook Pro 14 (Silver, Core i7, 16GB/1TB SSD)", SKU = "AARYA-ULTP14-I7-1TB",
                Description = "AaryaTech UltraBook Pro 14 powered by Intel Core i7-13th Gen, 16GB DDR5 RAM, 1TB NVMe SSD, and a stunning 2.8K 120Hz OLED display. Weighs just 1.2kg with a 72Wh battery.",
                ShortDescription = "Ultra-thin OLED laptop with Core i7 and 1TB SSD",
                CategoryId = laptops.Id, BrandId = aaryaTech.Id,
                Price = 89999, Mrp = 99999, DiscountPercentage = 10,
                StockQuantity = 34, Rating = 4.6, RatingCount = 1234, ReviewsCount = 389,
                IsFeatured = true, Badge = "New Launch", Status = ProductStatus.Active
            },
            new Product
            {
                Name = "Samsung Galaxy Tab S9 Ultra (Graphite, 256GB, Wi-Fi)", SKU = "SAMSUNG-TABS9U-256-WIFI",
                Description = "Galaxy Tab S9 Ultra with 14.6\" Dynamic AMOLED 2X display, Snapdragon 8 Gen 2, S Pen included, 256GB storage, IP68 water resistance, and DeX mode support.",
                ShortDescription = "Premium Android tablet with 14.6-inch AMOLED display",
                CategoryId = electronics.Id, BrandId = samsung.Id,
                Price = 109999, Mrp = 119999, DiscountPercentage = 8,
                StockQuantity = 12, Rating = 4.6, RatingCount = 987, ReviewsCount = 234,
                IsFeatured = false, Badge = "Limited Stock", Status = ProductStatus.Active
            }
        };

        // Add product images
        var productImages = new Dictionary<string, List<string>>
        {
            ["NPRO-X1-256-BLUE"] = new() {
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600" },
            ["SAMSUNG-S25U-512-BLK"] = new() {
                "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600",
                "https://images.unsplash.com/photo-1628327623902-6a5c1f58ec41?w=600" },
            ["APPLE-MBA-M3-512-MID"] = new() {
                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
                "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600" },
            ["SONY-WH1000XM5-BLK"] = new() {
                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600",
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
            ["NIKE-AM270-BLK-9"] = new() {
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
                "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600" },
            ["BOSE-QC45-WHITE"] = new() {
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
            ["AARYA-ULTP14-I7-1TB"] = new() {
                "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600",
                "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600" },
            ["SAMSUNG-TABS9U-256-WIFI"] = new() {
                "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600" }
        };

        foreach (var product in products)
        {
            if (productImages.TryGetValue(product.SKU, out var images))
            {
                for (int i = 0; i < images.Count; i++)
                    product.Images.Add(new ProductImage { ImageUrl = images[i], DisplayOrder = i, IsPrimary = i == 0 });
            }

            // Add sample review
            product.Reviews.Add(new Review
            {
                ProductId = product.Id,
                AuthorName = "Verified Buyer",
                Rating = 5, Title = "Excellent product!",
                Comment = "Absolutely love this product. Works exactly as described and delivery was super fast!",
                IsApproved = true
            });
        }

        context.Products.AddRange(products);
        await context.SaveChangesAsync();

        // 8. Coupons
        var coupons = new[]
        {
            new Coupon { Code = "WELCOME100", Description = "Welcome discount – ₹100 off on orders above ₹500",
                DiscountType = DiscountType.Flat, DiscountAmount = 100, MinimumPurchase = 500, IsActive = true },
            new Coupon { Code = "SAVE200", Description = "Save ₹200 on orders above ₹1000",
                DiscountType = DiscountType.Flat, DiscountAmount = 200, MinimumPurchase = 1000, IsActive = true },
            new Coupon { Code = "FLAT10PCT", Description = "Flat 10% off on all orders",
                DiscountType = DiscountType.Percentage, DiscountAmount = 10, MinimumPurchase = 0, MaxDiscount = 500, IsActive = true },
            new Coupon { Code = "AARYA500", Description = "₹500 off on orders above ₹2000",
                DiscountType = DiscountType.Flat, DiscountAmount = 500, MinimumPurchase = 2000, IsActive = true },
            new Coupon { Code = "FIRST15", Description = "15% off for first-time buyers",
                DiscountType = DiscountType.Percentage, DiscountAmount = 15, MinimumPurchase = 0, MaxDiscount = 1500, IsActive = true }
        };
        context.Coupons.AddRange(coupons);

        // 9. Shipping Methods
        context.ShippingMethods.AddRange(
            new ShippingMethod { Name = "Standard Free", Description = "3-5 business days", Cost = 0m, EstimatedDays = 5, IsActive = true },
            new ShippingMethod { Name = "Express Next-Day", Description = "Next business day delivery", Cost = 99m, EstimatedDays = 1, IsActive = true },
            new ShippingMethod { Name = "2-Day Delivery", Description = "2 business day delivery", Cost = 49m, EstimatedDays = 2, IsActive = true }
        );

        await context.SaveChangesAsync();

        // Queue all products for background embedding generation
        foreach (var p in products)
            EmbeddingQueueHelper.QueueProduct(p.Id);

        Console.WriteLine($"[ECommerce] Database seeded successfully! {products.Count} products, {coupons.Length} coupons, 2 users.");
    }
}

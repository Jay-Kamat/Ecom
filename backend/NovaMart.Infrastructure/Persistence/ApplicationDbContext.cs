using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NovaMart.Application.Common.Interfaces;
using NovaMart.Domain.Entities;

namespace NovaMart.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<SavedAddress> SavedAddresses => Set<SavedAddress>();
    public DbSet<UserCart> UserCarts => Set<UserCart>();
    public DbSet<UserWishlist> UserWishlists => Set<UserWishlist>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Helper value converter for JSON columns
        ValueConverter<T, string> CreateJsonConverter<T>() where T : new()
        {
            return new ValueConverter<T, string>(
                v => JsonSerializer.Serialize(v, JsonOptions),
                v => string.IsNullOrEmpty(v) ? new T() : JsonSerializer.Deserialize<T>(v, JsonOptions) ?? new T()
            );
        }

        // 1. Product Configuration
        modelBuilder.Entity<Product>(b =>
        {
            b.ToTable("products");
            b.HasKey(p => p.Id);
            b.Property(p => p.Id).HasMaxLength(64);
            b.Property(p => p.Title).HasMaxLength(256).IsRequired();
            b.Property(p => p.Category).HasMaxLength(64).IsRequired();
            b.Property(p => p.Brand).HasMaxLength(64).IsRequired();
            b.Property(p => p.Price).HasPrecision(12, 2);
            b.Property(p => p.Mrp).HasPrecision(12, 2);

            b.Property(p => p.Images)
                .HasColumnType("jsonb")
                .HasConversion(CreateJsonConverter<List<string>>());

            b.Property(p => p.Variants)
                .HasColumnType("jsonb")
                .HasConversion(CreateJsonConverter<ProductVariants>());

            b.Property(p => p.Specs)
                .HasColumnType("jsonb")
                .HasConversion(CreateJsonConverter<List<ProductSpec>>());

            b.Property(p => p.Offers)
                .HasColumnType("jsonb")
                .HasConversion(CreateJsonConverter<List<string>>());

            b.Property(p => p.Reviews)
                .HasColumnType("jsonb")
                .HasConversion(CreateJsonConverter<List<ProductReview>>());

            b.HasIndex(p => p.Category);
            b.HasIndex(p => p.Brand);
        });

        // 2. Order Configuration
        modelBuilder.Entity<Order>(b =>
        {
            b.ToTable("orders");
            b.HasKey(o => o.Id);
            b.Property(o => o.Id).HasMaxLength(64);
            b.Property(o => o.Email).HasMaxLength(128).IsRequired();
            b.Property(o => o.Subtotal).HasPrecision(12, 2);
            b.Property(o => o.Discount).HasPrecision(12, 2);
            b.Property(o => o.DeliveryFee).HasPrecision(12, 2);
            b.Property(o => o.Tax).HasPrecision(12, 2);
            b.Property(o => o.Total).HasPrecision(12, 2);

            b.Property(o => o.Items)
                .HasColumnType("jsonb")
                .HasConversion(CreateJsonConverter<List<OrderItem>>());

            b.HasIndex(o => o.Email);
            b.HasIndex(o => o.Status);
        });

        // 3. User Configuration
        modelBuilder.Entity<User>(b =>
        {
            b.ToTable("users");
            b.HasKey(u => u.Id);
            b.Property(u => u.Id).HasMaxLength(64);
            b.Property(u => u.Email).HasMaxLength(128).IsRequired();
            b.HasIndex(u => u.Email).IsUnique();
        });

        // 4. Coupon Configuration
        modelBuilder.Entity<Coupon>(b =>
        {
            b.ToTable("coupons");
            b.HasKey(c => c.Code);
            b.Property(c => c.Code).HasMaxLength(32);
            b.Property(c => c.DiscountFlat).HasPrecision(12, 2);
            b.Property(c => c.MinCart).HasPrecision(12, 2);
        });

        // 5. SavedAddress Configuration
        modelBuilder.Entity<SavedAddress>(b =>
        {
            b.ToTable("saved_addresses");
            b.HasKey(a => a.Id);
            b.Property(a => a.Id).HasMaxLength(64);
            b.Property(a => a.UserEmail).HasMaxLength(128).IsRequired();
            b.HasIndex(a => a.UserEmail);
        });

        // 6. UserCart Configuration
        modelBuilder.Entity<UserCart>(b =>
        {
            b.ToTable("user_carts");
            b.HasKey(c => c.UserEmail);
            b.Property(c => c.UserEmail).HasMaxLength(128);

            b.Property(c => c.Items)
                .HasColumnType("jsonb")
                .HasConversion(CreateJsonConverter<List<CartItem>>());
        });

        // 7. UserWishlist Configuration
        modelBuilder.Entity<UserWishlist>(b =>
        {
            b.ToTable("user_wishlists");
            b.HasKey(w => w.UserEmail);
            b.Property(w => w.UserEmail).HasMaxLength(128);

            b.Property(w => w.ProductIds)
                .HasColumnType("jsonb")
                .HasConversion(CreateJsonConverter<List<string>>());
        });
    }
}

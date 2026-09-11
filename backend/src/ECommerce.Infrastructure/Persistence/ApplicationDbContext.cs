using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;
using ECommerce.Application.Common.Interfaces;
using ECommerce.Domain.Common;
using ECommerce.Domain.Entities;

namespace ECommerce.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService? _currentUserService;
    private readonly IDateTimeService? _dateTimeService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService? currentUserService = null,
        IDateTimeService? dateTimeService = null)
        : base(options)
    {
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Address> Addresses => Set<Address>();

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<SubCategory> SubCategories => Set<SubCategory>();
    public DbSet<Brand> Brands => Set<Brand>();

    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductAttribute> ProductAttributes => Set<ProductAttribute>();
    public DbSet<ProductAttributeValue> ProductAttributeValues => Set<ProductAttributeValue>();
    public DbSet<ProductEmbedding> ProductEmbeddings => Set<ProductEmbedding>();

    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();

    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<ShippingAddress> ShippingAddresses => Set<ShippingAddress>();
    public DbSet<ShippingMethod> ShippingMethods => Set<ShippingMethod>();

    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Discount> Discounts => Set<Discount>();

    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ReviewImage> ReviewImages => Set<ReviewImage>();

    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Identity
        modelBuilder.Entity<User>(b =>
        {
            b.ToTable("users");
            b.HasKey(u => u.Id);
            b.Property(u => u.Email).HasMaxLength(150).IsRequired();
            b.HasIndex(u => u.Email).IsUnique();
            b.HasQueryFilter(u => !u.IsDeleted);
        });

        modelBuilder.Entity<Role>(b =>
        {
            b.ToTable("roles");
            b.HasKey(r => r.Id);
            b.Property(r => r.Name).HasMaxLength(50).IsRequired();
            b.HasIndex(r => r.Name).IsUnique();
        });

        modelBuilder.Entity<Permission>(b =>
        {
            b.ToTable("permissions");
            b.HasKey(p => p.Id);
            b.Property(p => p.Name).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<UserRole>(b =>
        {
            b.ToTable("user_roles");
            b.HasKey(ur => new { ur.UserId, ur.RoleId });
            b.HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
            b.HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId);
        });

        modelBuilder.Entity<RolePermission>(b =>
        {
            b.ToTable("role_permissions");
            b.HasKey(rp => new { rp.RoleId, rp.PermissionId });
            b.HasOne(rp => rp.Role).WithMany(r => r.RolePermissions).HasForeignKey(rp => rp.RoleId);
            b.HasOne(rp => rp.Permission).WithMany(p => p.RolePermissions).HasForeignKey(rp => rp.PermissionId);
        });

        // 2. Customer
        modelBuilder.Entity<Customer>(b =>
        {
            b.ToTable("customers");
            b.HasKey(c => c.Id);
            b.Property(c => c.Email).HasMaxLength(150).IsRequired();
            b.HasIndex(c => c.Email);
            b.HasOne(c => c.User).WithOne(u => u.Customer).HasForeignKey<Customer>(c => c.UserId).OnDelete(DeleteBehavior.SetNull);
            b.HasQueryFilter(c => !c.IsDeleted);
        });

        modelBuilder.Entity<Address>(b =>
        {
            b.ToTable("addresses");
            b.HasKey(a => a.Id);
            b.HasOne(a => a.Customer).WithMany(c => c.Addresses).HasForeignKey(a => a.CustomerId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(a => !a.IsDeleted);
        });

        // 3. Catalog
        modelBuilder.Entity<Category>(b =>
        {
            b.ToTable("categories");
            b.HasKey(c => c.Id);
            b.Property(c => c.Name).HasMaxLength(100).IsRequired();
            b.Property(c => c.Slug).HasMaxLength(100).IsRequired();
            b.HasIndex(c => c.Slug);
            b.HasOne(c => c.ParentCategory).WithMany().HasForeignKey(c => c.ParentCategoryId).OnDelete(DeleteBehavior.Restrict);
            b.HasQueryFilter(c => !c.IsDeleted);
        });

        modelBuilder.Entity<SubCategory>(b =>
        {
            b.ToTable("sub_categories");
            b.HasKey(s => s.Id);
            b.Property(s => s.Name).HasMaxLength(100).IsRequired();
            b.HasOne(s => s.Category).WithMany().HasForeignKey(s => s.CategoryId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(s => !s.IsDeleted);
        });

        modelBuilder.Entity<Brand>(b =>
        {
            b.ToTable("brands");
            b.HasKey(b => b.Id);
            b.Property(b => b.Name).HasMaxLength(100).IsRequired();
            b.Property(b => b.Slug).HasMaxLength(100).IsRequired();
            b.HasIndex(b => b.Slug);
            b.HasQueryFilter(b => !b.IsDeleted);
        });

        modelBuilder.Entity<Product>(b =>
        {
            b.ToTable("products");
            b.HasKey(p => p.Id);
            b.Property(p => p.Name).HasMaxLength(250).IsRequired();
            b.Property(p => p.SKU).HasMaxLength(100).IsRequired();
            b.Property(p => p.Price).HasPrecision(12, 2);
            b.Property(p => p.Mrp).HasPrecision(12, 2);
            b.Property(p => p.DiscountPercentage).HasPrecision(5, 2);
            b.Property(p => p.TaxPercentage).HasPrecision(5, 2);
            b.Property(p => p.WeightKg).HasPrecision(8, 3);
            b.HasIndex(p => p.SKU).IsUnique();
            b.HasIndex(p => p.CategoryId);
            b.HasIndex(p => p.BrandId);
            b.HasIndex(p => p.Price);
            b.HasIndex(p => p.Rating);
            b.HasOne(p => p.Category).WithMany(c => c.Products).HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(p => p.Brand).WithMany(b => b.Products).HasForeignKey(p => p.BrandId).OnDelete(DeleteBehavior.Restrict);
            b.HasQueryFilter(p => !p.IsDeleted);
        });

        modelBuilder.Entity<ProductImage>(b =>
        {
            b.ToTable("product_images");
            b.HasKey(pi => pi.Id);
            b.HasOne(pi => pi.Product).WithMany(p => p.Images).HasForeignKey(pi => pi.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductVariant>(b =>
        {
            b.ToTable("product_variants");
            b.HasKey(pv => pv.Id);
            b.Property(pv => pv.PriceAdjustment).HasPrecision(12, 2);
            b.HasOne(pv => pv.Product).WithMany(p => p.Variants).HasForeignKey(pv => pv.ProductId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(pv => !pv.IsDeleted);
        });

        modelBuilder.Entity<ProductAttribute>(b =>
        {
            b.ToTable("product_attributes");
            b.HasKey(pa => pa.Id);
            b.Property(pa => pa.Name).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<ProductAttributeValue>(b =>
        {
            b.ToTable("product_attribute_values");
            b.HasKey(pav => pav.Id);
            b.HasOne(pav => pav.Product).WithMany(p => p.AttributeValues).HasForeignKey(pav => pav.ProductId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(pav => pav.Attribute).WithMany(pa => pa.Values).HasForeignKey(pav => pav.AttributeId).OnDelete(DeleteBehavior.Restrict);
        });

        // Product Embedding (pgvector support)
        modelBuilder.Entity<ProductEmbedding>(b =>
        {
            b.ToTable("product_embeddings");
            b.HasKey(pe => pe.Id);
            b.HasIndex(pe => pe.ProductId).IsUnique();
            b.HasOne(pe => pe.Product).WithMany(p => p.Embeddings).HasForeignKey(pe => pe.ProductId).OnDelete(DeleteBehavior.Cascade);
            b.Property(pe => pe.Content).HasColumnType("text");
            b.Property(pe => pe.Model).HasMaxLength(64);
            b.HasQueryFilter(pe => !pe.IsDeleted);
        });

        // 4. Inventory
        modelBuilder.Entity<Inventory>(b =>
        {
            b.ToTable("inventories");
            b.HasKey(i => i.Id);
            b.HasOne(i => i.Product).WithOne(p => p.Inventory).HasForeignKey<Inventory>(i => i.ProductId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(i => !i.IsDeleted);
        });

        modelBuilder.Entity<InventoryTransaction>(b =>
        {
            b.ToTable("inventory_transactions");
            b.HasKey(it => it.Id);
            b.HasOne(it => it.Inventory).WithMany(i => i.Transactions).HasForeignKey(it => it.InventoryId).OnDelete(DeleteBehavior.Cascade);
        });

        // 5. Cart & Wishlist
        modelBuilder.Entity<Cart>(b =>
        {
            b.ToTable("carts");
            b.HasKey(c => c.Id);
            b.HasOne(c => c.Customer).WithOne(cu => cu.Cart).HasForeignKey<Cart>(c => c.CustomerId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(c => !c.IsDeleted);
        });

        modelBuilder.Entity<CartItem>(b =>
        {
            b.ToTable("cart_items");
            b.HasKey(ci => ci.Id);
            b.Property(ci => ci.UnitPrice).HasPrecision(12, 2);
            b.HasOne(ci => ci.Cart).WithMany(c => c.Items).HasForeignKey(ci => ci.CartId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(ci => ci.Product).WithMany().HasForeignKey(ci => ci.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Wishlist>(b =>
        {
            b.ToTable("wishlists");
            b.HasKey(w => w.Id);
            b.HasOne(w => w.Customer).WithOne(cu => cu.Wishlist).HasForeignKey<Wishlist>(w => w.CustomerId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(w => !w.IsDeleted);
        });

        modelBuilder.Entity<WishlistItem>(b =>
        {
            b.ToTable("wishlist_items");
            b.HasKey(wi => wi.Id);
            b.HasOne(wi => wi.Wishlist).WithMany(w => w.Items).HasForeignKey(wi => wi.WishlistId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(wi => wi.Product).WithMany().HasForeignKey(wi => wi.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        // 6. Orders
        modelBuilder.Entity<Order>(b =>
        {
            b.ToTable("orders");
            b.HasKey(o => o.Id);
            b.Property(o => o.OrderNumber).HasMaxLength(64).IsRequired();
            b.HasIndex(o => o.OrderNumber).IsUnique();
            b.Property(o => o.Subtotal).HasPrecision(12, 2);
            b.Property(o => o.DiscountAmount).HasPrecision(12, 2);
            b.Property(o => o.TaxAmount).HasPrecision(12, 2);
            b.Property(o => o.ShippingFee).HasPrecision(12, 2);
            b.Property(o => o.TotalAmount).HasPrecision(12, 2);
            b.HasOne(o => o.Customer).WithMany(c => c.Orders).HasForeignKey(o => o.CustomerId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(o => o.ShippingAddress).WithMany().HasForeignKey(o => o.ShippingAddressId).OnDelete(DeleteBehavior.Restrict);
            b.HasQueryFilter(o => !o.IsDeleted);
        });

        modelBuilder.Entity<OrderItem>(b =>
        {
            b.ToTable("order_items");
            b.HasKey(oi => oi.Id);
            b.Property(oi => oi.UnitPrice).HasPrecision(12, 2);
            b.Property(oi => oi.TotalPrice).HasPrecision(12, 2);
            b.HasOne(oi => oi.Order).WithMany(o => o.Items).HasForeignKey(oi => oi.OrderId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(oi => oi.Product).WithMany().HasForeignKey(oi => oi.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderStatusHistory>(b =>
        {
            b.ToTable("order_status_histories");
            b.HasKey(osh => osh.Id);
            b.HasOne(osh => osh.Order).WithMany(o => o.StatusHistory).HasForeignKey(osh => osh.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShippingAddress>(b =>
        {
            b.ToTable("shipping_addresses");
            b.HasKey(sa => sa.Id);
        });

        modelBuilder.Entity<ShippingMethod>(b =>
        {
            b.ToTable("shipping_methods");
            b.HasKey(sm => sm.Id);
            b.Property(sm => sm.Cost).HasPrecision(12, 2);
            b.HasQueryFilter(sm => !sm.IsDeleted);
        });

        // 7. Payments
        modelBuilder.Entity<Payment>(b =>
        {
            b.ToTable("payments");
            b.HasKey(p => p.Id);
            b.Property(p => p.Amount).HasPrecision(12, 2);
            b.HasOne(p => p.Order).WithMany(o => o.Payments).HasForeignKey(p => p.OrderId).OnDelete(DeleteBehavior.Cascade);
            b.HasQueryFilter(p => !p.IsDeleted);
        });

        modelBuilder.Entity<PaymentTransaction>(b =>
        {
            b.ToTable("payment_transactions");
            b.HasKey(pt => pt.Id);
            b.Property(pt => pt.Amount).HasPrecision(12, 2);
            b.HasOne(pt => pt.Payment).WithMany(p => p.Transactions).HasForeignKey(pt => pt.PaymentId).OnDelete(DeleteBehavior.Cascade);
        });

        // 8. Coupons & Discounts
        modelBuilder.Entity<Coupon>(b =>
        {
            b.ToTable("coupons");
            b.HasKey(c => c.Id);
            b.Property(c => c.Code).HasMaxLength(50).IsRequired();
            b.HasIndex(c => c.Code).IsUnique();
            b.Property(c => c.DiscountAmount).HasPrecision(12, 2);
            b.Property(c => c.MinimumPurchase).HasPrecision(12, 2);
            b.Property(c => c.MaxDiscount).HasPrecision(12, 2);
            b.HasQueryFilter(c => !c.IsDeleted);
        });

        modelBuilder.Entity<Discount>(b =>
        {
            b.ToTable("discounts");
            b.HasKey(d => d.Id);
            b.Property(d => d.Percentage).HasPrecision(5, 2);
            b.HasQueryFilter(d => !d.IsDeleted);
        });

        // 9. Reviews
        modelBuilder.Entity<Review>(b =>
        {
            b.ToTable("reviews");
            b.HasKey(r => r.Id);
            b.HasOne(r => r.Product).WithMany(p => p.Reviews).HasForeignKey(r => r.ProductId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(r => r.Customer).WithMany().HasForeignKey(r => r.CustomerId).OnDelete(DeleteBehavior.SetNull);
            b.HasQueryFilter(r => !r.IsDeleted);
        });

        modelBuilder.Entity<ReviewImage>(b =>
        {
            b.ToTable("review_images");
            b.HasKey(ri => ri.Id);
            b.HasOne(ri => ri.Review).WithMany(r => r.Images).HasForeignKey(ri => ri.ReviewId).OnDelete(DeleteBehavior.Cascade);
        });

        // 10. System
        modelBuilder.Entity<Notification>(b =>
        {
            b.ToTable("notifications");
            b.HasKey(n => n.Id);
            b.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(b =>
        {
            b.ToTable("audit_logs");
            b.HasKey(al => al.Id);
        });
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = _dateTimeService?.UtcNow ?? DateTime.UtcNow;
        var userEmail = _currentUserService?.Email ?? "System";

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = userEmail;
                    entry.Entity.Version = 1;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userEmail;
                    entry.Entity.Version++;
                    break;
                case EntityState.Deleted:
                    if (entry.Entity is ISoftDeletable softDeletable)
                    {
                        entry.State = EntityState.Modified;
                        softDeletable.IsDeleted = true;
                        softDeletable.DeletedAt = now;
                        softDeletable.DeletedBy = userEmail;
                    }
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}

using ECommerce.Domain.Common;
using ECommerce.Domain.Enums;

namespace ECommerce.Domain.Entities;

public class Category : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public Category? ParentCategory { get; set; }

    public ICollection<SubCategory> SubCategories { get; set; } = new List<SubCategory>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class SubCategory : AuditableEntity
{
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Brand : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Product : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public Guid? SubCategoryId { get; set; }
    public SubCategory? SubCategory { get; set; }

    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public decimal Price { get; set; }
    public decimal Mrp { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal TaxPercentage { get; set; } = 18m;
    public int StockQuantity { get; set; } = 0;
    public decimal WeightKg { get; set; } = 0.5m;
    public string Dimensions { get; set; } = string.Empty; // e.g. "15x7.5x0.8 cm"

    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public bool IsFeatured { get; set; } = false;
    public string Badge { get; set; } = string.Empty; // "Trending Deal", "Bestseller"

    // SEO
    public string MetaTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;
    public string MetaKeywords { get; set; } = string.Empty;

    // Aggregates / Social proof
    public double Rating { get; set; } = 4.5;
    public int RatingCount { get; set; } = 0;
    public int ReviewsCount { get; set; } = 0;

    // Navigation collections
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductAttributeValue> AttributeValues { get; set; } = new List<ProductAttributeValue>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<ProductEmbedding> Embeddings { get; set; } = new List<ProductEmbedding>();
    public Inventory? Inventory { get; set; }
}

public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string ImageUrl { get; set; } = string.Empty;
    public string AltText { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;
    public bool IsPrimary { get; set; } = false;
}

public class ProductVariant : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty; // e.g. "Space Gray / 256GB"
    public decimal PriceAdjustment { get; set; } = 0m;
    public int StockQuantity { get; set; } = 0;
    public string AttributesJson { get; set; } = "{}"; // JSON map: {"Color": "Black", "Size": "M"}
}

public class ProductAttribute : BaseEntity
{
    public string Name { get; set; } = string.Empty; // e.g. "Color", "RAM", "Size"
    public string DisplayName { get; set; } = string.Empty;

    public ICollection<ProductAttributeValue> Values { get; set; } = new List<ProductAttributeValue>();
}

public class ProductAttributeValue : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid AttributeId { get; set; }
    public ProductAttribute Attribute { get; set; } = null!;
    public string Value { get; set; } = string.Empty; // e.g. "12GB", "Midnight Blue"
}

public class ProductEmbedding : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Content { get; set; } = string.Empty; // text chunk used for embedding
    public float[] Embedding { get; set; } = Array.Empty<float>();
    public string Model { get; set; } = "all-MiniLM-L6-v2-384d";
}

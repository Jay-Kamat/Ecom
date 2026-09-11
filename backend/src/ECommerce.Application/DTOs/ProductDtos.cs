namespace ECommerce.Application.DTOs;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Title { get => Name; set => Name = value; } // Frontend compatibility alias
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }
    public string Category { get; set; } = string.Empty;

    public Guid? SubCategoryId { get; set; }
    public string? SubCategory { get; set; }

    public Guid BrandId { get; set; }
    public string Brand { get; set; } = string.Empty;

    public decimal Price { get; set; }
    public decimal Mrp { get; set; }
    public decimal Discount { get => DiscountPercentage; set => DiscountPercentage = value; }
    public decimal DiscountPercentage { get; set; }
    public decimal TaxPercentage { get; set; }

    public int StockCount { get => StockQuantity; set => StockQuantity = value; }
    public int StockQuantity { get; set; }
    public bool InStock => StockQuantity > 0;

    public decimal WeightKg { get; set; }
    public string Dimensions { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public bool IsFeatured { get; set; }
    public string Badge { get; set; } = string.Empty;

    public double Rating { get; set; }
    public int RatingCount { get; set; }
    public int ReviewsCount { get; set; }

    public List<string> Images { get; set; } = new();
    public List<ProductVariantDto> Variants { get; set; } = new();
    public List<ProductAttributeDto> Attributes { get; set; } = new();
    public List<ProductSpecDto> Specs { get; set; } = new();
    public List<ReviewDto> Reviews { get; set; } = new();
}

public class ProductVariantDto
{
    public Guid Id { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal PriceAdjustment { get; set; }
    public int StockQuantity { get; set; }
    public string AttributesJson { get; set; } = "{}";
}

public class ProductAttributeDto
{
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class ProductSpecDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class ReviewDto
{
    public Guid Id { get; set; }
    public string Author { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public List<string> Images { get; set; } = new();
}

public class ProductSearchResultDto
{
    public ProductDto Product { get; set; } = null!;
    public double SimilarityScore { get; set; }
    public string MatchType { get; set; } = "Semantic"; // Semantic, Keyword, Hybrid
}

public class CreateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string? Title { set => Name = value ?? string.Empty; }
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public Guid? CategoryId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public Guid? BrandId { get; set; }
    public decimal Price { get; set; }
    public decimal Mrp { get; set; }
    public decimal Discount { get; set; }
    public int StockQuantity { get; set; } = 10;
    public int StockCount { set => StockQuantity = value; }
    public decimal WeightKg { get; set; } = 0.5m;
    public string Dimensions { get; set; } = string.Empty;
    public string Badge { get; set; } = "Trending Deal";
    public bool IsFeatured { get; set; }
    public List<string> Images { get; set; } = new();
    public List<ProductSpecDto> Specs { get; set; } = new();
}

public class UpdateProductDto : CreateProductDto
{
    public Guid Id { get; set; }
}

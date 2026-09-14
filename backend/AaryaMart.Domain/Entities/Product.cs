namespace AaryaMart.Domain.Entities;

public class ProductSpec
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class ProductReview
{
    public string Author { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string Date { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}

public class ProductVariants
{
    public List<string>? Color { get; set; }
    public List<string>? Storage { get; set; }
    public List<string>? Size { get; set; }
    public List<string>? DisplaySize { get; set; }
}

public class Product
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Mrp { get; set; }
    public int Discount { get; set; }
    public double Rating { get; set; } = 4.5;
    public int RatingCount { get; set; } = 100;
    public int ReviewsCount { get; set; } = 25;
    public bool InStock { get; set; } = true;
    public int StockCount { get; set; } = 20;
    public string Badge { get; set; } = "Trending Deal";
    public List<string> Images { get; set; } = new();
    public ProductVariants Variants { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public List<ProductSpec> Specs { get; set; } = new();
    public List<string> Offers { get; set; } = new();
    public List<ProductReview> Reviews { get; set; } = new();
}

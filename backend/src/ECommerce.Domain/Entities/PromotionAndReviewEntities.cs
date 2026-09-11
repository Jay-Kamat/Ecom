using ECommerce.Domain.Common;

namespace ECommerce.Domain.Entities;

public enum DiscountType
{
    Flat = 1,
    Percentage = 2
}

public class Coupon : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; } = DiscountType.Flat;
    public decimal DiscountAmount { get; set; }
    public decimal MinimumPurchase { get; set; } = 0m;
    public decimal? MaxDiscount { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int UsageLimit { get; set; } = 1000;
    public int UsageCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

public class Discount : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal Percentage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Review : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public string AuthorName { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = true;

    public ICollection<ReviewImage> Images { get; set; } = new List<ReviewImage>();
}

public class ReviewImage : BaseEntity
{
    public Guid ReviewId { get; set; }
    public Review Review { get; set; } = null!;
    public string ImageUrl { get; set; } = string.Empty;
}

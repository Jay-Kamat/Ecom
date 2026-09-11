namespace NovaMart.Domain.Entities;

public class Coupon
{
    public string Code { get; set; } = string.Empty;
    public int? DiscountPercent { get; set; }
    public decimal? DiscountFlat { get; set; }
    public decimal MinCart { get; set; } = 0;
    public string Description { get; set; } = string.Empty;
    public int UsageCount { get; set; } = 0;
    public string Validity { get; set; } = "31 Dec 2026";
}

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace NovaMart.Api.Models;

public class Coupon
{
    [BsonId]
    public string Code { get; set; } = string.Empty;

    public int? DiscountPercent { get; set; }
    public decimal? DiscountFlat { get; set; }
    public decimal MinCart { get; set; } = 0;
    public string Description { get; set; } = string.Empty;
    public int UsageCount { get; set; } = 0;
    public string Validity { get; set; } = "31 Dec 2026";
}

public class SavedAddress
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = string.Empty;

    public string UserEmail { get; set; } = string.Empty;
    public string Tag { get; set; } = "Home"; // Home, Work, Other
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;
}

public class CartItem
{
    public string ProductId { get; set; } = string.Empty;
    public int Qty { get; set; } = 1;
}

public class UserCart
{
    [BsonId]
    public string UserEmail { get; set; } = string.Empty;
    public List<CartItem> Items { get; set; } = new();
}

public class UserWishlist
{
    [BsonId]
    public string UserEmail { get; set; } = string.Empty;
    public List<string> ProductIds { get; set; } = new();
}

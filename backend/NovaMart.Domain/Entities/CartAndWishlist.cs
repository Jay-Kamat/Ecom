namespace NovaMart.Domain.Entities;

public class CartItem
{
    public string ProductId { get; set; } = string.Empty;
    public int Qty { get; set; } = 1;
}

public class UserCart
{
    public string UserEmail { get; set; } = string.Empty;
    public List<CartItem> Items { get; set; } = new();
}

public class UserWishlist
{
    public string UserEmail { get; set; } = string.Empty;
    public List<string> ProductIds { get; set; } = new();
}

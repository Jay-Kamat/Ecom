namespace NovaMart.Domain.Entities;

public class OrderItem
{
    public string ProductId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int Qty { get; set; } = 1;
    public decimal Price { get; set; }
    public string Img { get; set; } = string.Empty;
}

public class Order
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = DateTime.UtcNow.ToString("dd MMM yyyy");
    public string Customer { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Status { get; set; } = "Placed"; // Placed, Confirmed, Shipped, Delivered, Cancelled
    public string TrackingId { get; set; } = string.Empty;
    public string DeliverySpeed { get; set; } = "Standard Free";
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
    public List<OrderItem> Items { get; set; } = new();
    public string PaymentMethod { get; set; } = "UPI";
}

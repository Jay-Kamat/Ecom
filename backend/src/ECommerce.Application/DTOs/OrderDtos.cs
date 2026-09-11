namespace ECommerce.Application.DTOs;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Status { get; set; } = "Placed";
    public string TrackingId { get; set; } = string.Empty;
    public string DeliverySpeed { get; set; } = "Standard Free";
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = "UPI";
    public string PaymentStatus { get; set; } = "Pending";
    public List<OrderItemDto> Items { get; set; } = new();
    public List<OrderStatusHistoryDto> StatusHistory { get; set; } = new();
}

public class OrderItemDto
{
    public Guid ProductId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Qty { get; set; } = 1;
    public decimal Price { get; set; }
    public string Img { get; set; } = string.Empty;
}

public class OrderStatusHistoryDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateOrderDto
{
    public string Customer { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string DeliverySpeed { get; set; } = "Standard Free";
    public string PaymentMethod { get; set; } = "UPI";
    public string? CouponCode { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
}

public class CreateOrderItemDto
{
    public string ProductId { get; set; } = string.Empty; // string or Guid
    public string Title { get; set; } = string.Empty;
    public int Qty { get; set; } = 1;
    public decimal Price { get; set; }
    public string Img { get; set; } = string.Empty;
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? TrackingId { get; set; }
    public string? Note { get; set; }
}

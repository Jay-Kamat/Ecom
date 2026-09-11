using ECommerce.Domain.Common;
using ECommerce.Domain.Enums;

namespace ECommerce.Domain.Entities;

public class Order : AuditableEntity
{
    public string OrderNumber { get; set; } = string.Empty; // e.g. "ORD-2026-987654"

    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Placed;

    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DeliveryFee { get => ShippingFee; set => ShippingFee = value; }
    public decimal TotalAmount { get; set; }
    public decimal Total { get => TotalAmount; set => TotalAmount = value; }
    public decimal Discount { get => DiscountAmount; set => DiscountAmount = value; }
    public decimal Tax { get => TaxAmount; set => TaxAmount = value; }

    public string? CouponCode { get; set; }
    public string? TrackingNumber { get; set; }

    public Guid ShippingAddressId { get; set; }
    public ShippingAddress ShippingAddress { get; set; } = null!;

    public Guid? ShippingMethodId { get; set; }
    public ShippingMethod? ShippingMethod { get; set; }

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.UPI;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}

public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public OrderStatus Status { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
}

public class ShippingAddress : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
}

public class ShippingMethod : AuditableEntity
{
    public string Name { get; set; } = "Standard Delivery"; // e.g. "Express Next-Day"
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; } = 0m;
    public int EstimatedDays { get; set; } = 3;
    public bool IsActive { get; set; } = true;
}

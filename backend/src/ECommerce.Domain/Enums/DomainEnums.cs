namespace ECommerce.Domain.Enums;

public enum OrderStatus
{
    Placed = 1,
    Confirmed = 2,
    Processing = 3,
    Shipped = 4,
    OutForDelivery = 5,
    Delivered = 6,
    Cancelled = 7,
    Returned = 8
}

public enum PaymentStatus
{
    Pending = 1,
    Authorized = 2,
    Captured = 3,
    Failed = 4,
    Refunded = 5
}

public enum PaymentMethod
{
    UPI = 1,
    CreditCard = 2,
    DebitCard = 3,
    NetBanking = 4,
    CashOnDelivery = 5
}

public enum InventoryTransactionType
{
    InitialStock = 1,
    PurchaseRestock = 2,
    OrderReserved = 3,
    OrderFulfillment = 4,
    OrderCancelledReturn = 5,
    ManualAdjustment = 6
}

public enum ProductStatus
{
    Draft = 1,
    Active = 2,
    Archived = 3
}

public enum NotificationType
{
    OrderUpdate = 1,
    Promotion = 2,
    Security = 3,
    General = 4
}

namespace ECommerce.Application.DTOs;

// Cart & Wishlist
public class CartDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public List<CartItemDto> Items { get; set; } = new();
    public decimal Subtotal => Items.Sum(i => i.TotalPrice);
    public int TotalItems => Items.Sum(i => i.Quantity);
}

public class CartItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductTitle { get; set; } = string.Empty;
    public string ProductImage { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;
}

public class AddToCartDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class WishlistDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public List<ProductDto> Items { get; set; } = new();
}

// Customers & Addresses
public class CustomerDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public List<AddressDto> Addresses { get; set; } = new();
}

public class AddressDto
{
    public Guid Id { get; set; }
    public string UserEmail { get; set; } = string.Empty; // Frontend compatibility
    public string Tag { get; set; } = "Home";
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty; // Frontend compatibility
    public string PostalCode { get => Pin; set => Pin = value; }
    public bool IsDefault { get; set; }
}

public class CreateAddressDto
{
    public string UserEmail { get; set; } = string.Empty;
    public string Tag { get; set; } = "Home";
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

// Auth
public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer";
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int OrdersCount { get; set; }
    public DateTime JoinedAt { get; set; }
}

// Coupons
public class CouponDto
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "flat";
    public decimal DiscountFlat { get; set; }
    public decimal MinCart { get; set; }
    public bool IsActive { get; set; }
}

public class ValidateCouponResponseDto
{
    public bool Valid { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal Discount { get; set; }
    public decimal FinalTotal { get; set; }
    public string Message { get; set; } = string.Empty;
}

// Admin
public class AdminKpiDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalProducts { get; set; }
    public int PendingOrders { get; set; }
}

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public int OrdersCount { get; set; }
    public DateTime JoinedAt { get; set; }
}

using NovaMart.Api.Models;

namespace NovaMart.Api.Repositories;

public interface IDataStore
{
    // Products
    Task<IEnumerable<Product>> GetProductsAsync(string? category = null, string? brand = null, string? search = null, decimal? maxPrice = null, bool inStockOnly = false, double? minRating = null, string? sort = null);
    Task<Product?> GetProductByIdAsync(string id);
    Task<Product> CreateProductAsync(Product product);
    Task<bool> UpdateProductAsync(Product product);
    Task<bool> DeleteProductAsync(string id);
    Task<bool> AddProductReviewAsync(string productId, ProductReview review);

    // Users
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(string id);
    Task<User> CreateUserAsync(User user);
    Task<IEnumerable<User>> GetUsersAsync();
    Task<bool> UpdateUserStatusAsync(string id, string status);

    // Orders
    Task<IEnumerable<Order>> GetAllOrdersAsync();
    Task<IEnumerable<Order>> GetCustomerOrdersAsync(string email);
    Task<Order?> GetOrderByIdAsync(string id);
    Task<Order> CreateOrderAsync(Order order);
    Task<bool> UpdateOrderStatusAsync(string id, string status, string? trackingId);

    // Coupons
    Task<IEnumerable<Coupon>> GetCouponsAsync();
    Task<Coupon?> GetCouponByCodeAsync(string code);
    Task<Coupon> CreateCouponAsync(Coupon coupon);
    Task<bool> DeleteCouponAsync(string code);

    // Saved Addresses
    Task<IEnumerable<SavedAddress>> GetAddressesByUserAsync(string email);
    Task<SavedAddress> CreateAddressAsync(SavedAddress address);
    Task<bool> SetDefaultAddressAsync(string email, string addressId);
    Task<bool> DeleteAddressAsync(string id);

    // Cart & Wishlist
    Task<UserCart> GetCartAsync(string email);
    Task<bool> SaveCartAsync(UserCart cart);
    Task<UserWishlist> GetWishlistAsync(string email);
    Task<bool> SaveWishlistAsync(UserWishlist wishlist);
}

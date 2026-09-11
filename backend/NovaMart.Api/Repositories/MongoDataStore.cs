using MongoDB.Driver;
using NovaMart.Api.Models;

namespace NovaMart.Api.Repositories;

public class MongoDataStore : IDataStore
{
    private readonly IMongoCollection<Product> _products;
    private readonly IMongoCollection<User> _users;
    private readonly IMongoCollection<Order> _orders;
    private readonly IMongoCollection<Coupon> _coupons;
    private readonly IMongoCollection<SavedAddress> _addresses;
    private readonly IMongoCollection<UserCart> _carts;
    private readonly IMongoCollection<UserWishlist> _wishlists;

    public MongoDataStore(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoDb") ?? "mongodb://localhost:27017";
        var databaseName = configuration["DatabaseName"] ?? "NovaMartDb";

        var client = new MongoClient(connectionString);
        var db = client.GetDatabase(databaseName);

        _products = db.GetCollection<Product>("Products");
        _users = db.GetCollection<User>("Users");
        _orders = db.GetCollection<Order>("Orders");
        _coupons = db.GetCollection<Coupon>("Coupons");
        _addresses = db.GetCollection<SavedAddress>("Addresses");
        _carts = db.GetCollection<UserCart>("Carts");
        _wishlists = db.GetCollection<UserWishlist>("Wishlists");
    }

    public async Task<IEnumerable<Product>> GetProductsAsync(string? category = null, string? brand = null, string? search = null, decimal? maxPrice = null, bool inStockOnly = false, double? minRating = null, string? sort = null)
    {
        var filterBuilder = Builders<Product>.Filter;
        var filter = filterBuilder.Empty;

        if (!string.IsNullOrWhiteSpace(category) && category != "all")
            filter &= filterBuilder.Eq(p => p.Category, category);

        if (!string.IsNullOrWhiteSpace(brand))
            filter &= filterBuilder.Eq(p => p.Brand, brand);

        if (!string.IsNullOrWhiteSpace(search))
            filter &= filterBuilder.Regex(p => p.Title, new MongoDB.Bson.BsonRegularExpression(search, "i"));

        if (maxPrice.HasValue)
            filter &= filterBuilder.Lte(p => p.Price, maxPrice.Value);

        if (inStockOnly)
            filter &= filterBuilder.Eq(p => p.InStock, true);

        if (minRating.HasValue && minRating.Value > 0)
            filter &= filterBuilder.Gte(p => p.Rating, minRating.Value);

        var query = _products.Find(filter);

        query = sort switch
        {
            "price-low" => query.SortBy(p => p.Price),
            "price-high" => query.SortByDescending(p => p.Price),
            "rating" => query.SortByDescending(p => p.Rating),
            "discount" => query.SortByDescending(p => p.Discount),
            _ => query
        };

        return await query.ToListAsync();
    }

    public async Task<Product?> GetProductByIdAsync(string id)
    {
        return await _products.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Product> CreateProductAsync(Product product)
    {
        if (string.IsNullOrEmpty(product.Id))
            product.Id = Guid.NewGuid().ToString("N");
        await _products.InsertOneAsync(product);
        return product;
    }

    public async Task<bool> UpdateProductAsync(Product product)
    {
        var res = await _products.ReplaceOneAsync(p => p.Id == product.Id, product);
        return res.ModifiedCount > 0;
    }

    public async Task<bool> DeleteProductAsync(string id)
    {
        var res = await _products.DeleteOneAsync(p => p.Id == id);
        return res.DeletedCount > 0;
    }

    public async Task<bool> AddProductReviewAsync(string productId, ProductReview review)
    {
        var update = Builders<Product>.Update
            .Push(p => p.Reviews, review)
            .Inc(p => p.ReviewsCount, 1);
        var res = await _products.UpdateOneAsync(p => p.Id == productId, update);
        return res.ModifiedCount > 0;
    }

    // Users
    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _users.Find(u => u.Email.ToLower() == email.ToLower()).FirstOrDefaultAsync();
    }

    public async Task<User?> GetUserByIdAsync(string id)
    {
        return await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
    }

    public async Task<User> CreateUserAsync(User user)
    {
        if (string.IsNullOrEmpty(user.Id))
            user.Id = Guid.NewGuid().ToString("N");
        await _users.InsertOneAsync(user);
        return user;
    }

    public async Task<IEnumerable<User>> GetUsersAsync()
    {
        return await _users.Find(_ => true).ToListAsync();
    }

    public async Task<bool> UpdateUserStatusAsync(string id, string status)
    {
        var update = Builders<User>.Update.Set(u => u.Status, status);
        var res = await _users.UpdateOneAsync(u => u.Id == id, update);
        return res.ModifiedCount > 0;
    }

    // Orders
    public async Task<IEnumerable<Order>> GetAllOrdersAsync()
    {
        return await _orders.Find(_ => true).SortByDescending(o => o.Id).ToListAsync();
    }

    public async Task<IEnumerable<Order>> GetCustomerOrdersAsync(string email)
    {
        return await _orders.Find(o => o.Email.ToLower() == email.ToLower()).ToListAsync();
    }

    public async Task<Order?> GetOrderByIdAsync(string id)
    {
        return await _orders.Find(o => o.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Order> CreateOrderAsync(Order order)
    {
        if (string.IsNullOrEmpty(order.Id))
            order.Id = "NM-" + Random.Shared.Next(100000, 999999);
        await _orders.InsertOneAsync(order);
        return order;
    }

    public async Task<bool> UpdateOrderStatusAsync(string id, string status, string? trackingId)
    {
        var update = Builders<Order>.Update.Set(o => o.Status, status);
        if (!string.IsNullOrEmpty(trackingId))
            update = update.Set(o => o.TrackingId, trackingId);
        var res = await _orders.UpdateOneAsync(o => o.Id == id, update);
        return res.ModifiedCount > 0;
    }

    // Coupons
    public async Task<IEnumerable<Coupon>> GetCouponsAsync()
    {
        return await _coupons.Find(_ => true).ToListAsync();
    }

    public async Task<Coupon?> GetCouponByCodeAsync(string code)
    {
        return await _coupons.Find(c => c.Code.ToLower() == code.ToLower()).FirstOrDefaultAsync();
    }

    public async Task<Coupon> CreateCouponAsync(Coupon coupon)
    {
        coupon.Code = coupon.Code.ToUpperInvariant();
        await _coupons.ReplaceOneAsync(c => c.Code == coupon.Code, coupon, new ReplaceOptions { IsUpsert = true });
        return coupon;
    }

    public async Task<bool> DeleteCouponAsync(string code)
    {
        var res = await _coupons.DeleteOneAsync(c => c.Code.ToLower() == code.ToLower());
        return res.DeletedCount > 0;
    }

    // Saved Addresses
    public async Task<IEnumerable<SavedAddress>> GetAddressesByUserAsync(string email)
    {
        return await _addresses.Find(a => a.UserEmail.ToLower() == email.ToLower()).ToListAsync();
    }

    public async Task<SavedAddress> CreateAddressAsync(SavedAddress address)
    {
        if (string.IsNullOrEmpty(address.Id))
            address.Id = Guid.NewGuid().ToString("N");
        await _addresses.InsertOneAsync(address);
        return address;
    }

    public async Task<bool> SetDefaultAddressAsync(string email, string addressId)
    {
        var unsetAll = Builders<SavedAddress>.Update.Set(a => a.IsDefault, false);
        await _addresses.UpdateManyAsync(a => a.UserEmail.ToLower() == email.ToLower(), unsetAll);

        var setOne = Builders<SavedAddress>.Update.Set(a => a.IsDefault, true);
        var res = await _addresses.UpdateOneAsync(a => a.Id == addressId, setOne);
        return res.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAddressAsync(string id)
    {
        var res = await _addresses.DeleteOneAsync(a => a.Id == id);
        return res.DeletedCount > 0;
    }

    // Cart & Wishlist
    public async Task<UserCart> GetCartAsync(string email)
    {
        var cart = await _carts.Find(c => c.UserEmail.ToLower() == email.ToLower()).FirstOrDefaultAsync();
        return cart ?? new UserCart { UserEmail = email };
    }

    public async Task<bool> SaveCartAsync(UserCart cart)
    {
        var res = await _carts.ReplaceOneAsync(c => c.UserEmail.ToLower() == cart.UserEmail.ToLower(), cart, new ReplaceOptions { IsUpsert = true });
        return true;
    }

    public async Task<UserWishlist> GetWishlistAsync(string email)
    {
        var w = await _wishlists.Find(x => x.UserEmail.ToLower() == email.ToLower()).FirstOrDefaultAsync();
        return w ?? new UserWishlist { UserEmail = email };
    }

    public async Task<bool> SaveWishlistAsync(UserWishlist wishlist)
    {
        await _wishlists.ReplaceOneAsync(x => x.UserEmail.ToLower() == wishlist.UserEmail.ToLower(), wishlist, new ReplaceOptions { IsUpsert = true });
        return true;
    }
}

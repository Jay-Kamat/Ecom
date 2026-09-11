using System.Text.Json;
using NovaMart.Api.Models;
using NovaMart.Api.Services;

namespace NovaMart.Api.Repositories;

public class InMemoryDataStore : IDataStore
{
    private readonly List<Product> _products = new();
    private readonly List<User> _users = new();
    private readonly List<Order> _orders = new();
    private readonly List<Coupon> _coupons = new();
    private readonly List<SavedAddress> _addresses = new();
    private readonly Dictionary<string, UserCart> _carts = new();
    private readonly Dictionary<string, UserWishlist> _wishlists = new();
    private readonly object _lock = new();
    private readonly string _storageFilePath;

    public InMemoryDataStore(IPasswordHasher passwordHasher)
    {
        var appDataDir = Path.Combine(AppContext.BaseDirectory, "App_Data");
        Directory.CreateDirectory(appDataDir);
        _storageFilePath = Path.Combine(appDataDir, "store_state.json");

        if (!TryLoadFromDisk())
        {
            SeedInitialData(passwordHasher);
            SaveToDisk();
        }
    }

    private class PersistedSnapshot
    {
        public List<Product> Products { get; set; } = new();
        public List<User> Users { get; set; } = new();
        public List<Order> Orders { get; set; } = new();
        public List<Coupon> Coupons { get; set; } = new();
        public List<SavedAddress> Addresses { get; set; } = new();
    }

    private bool TryLoadFromDisk()
    {
        try
        {
            if (!File.Exists(_storageFilePath)) return false;
            var json = File.ReadAllText(_storageFilePath);
            var snapshot = JsonSerializer.Deserialize<PersistedSnapshot>(json);
            if (snapshot == null || snapshot.Products.Count == 0) return false;

            _products.AddRange(snapshot.Products);
            _users.AddRange(snapshot.Users);
            _orders.AddRange(snapshot.Orders);
            _coupons.AddRange(snapshot.Coupons);
            _addresses.AddRange(snapshot.Addresses);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private void SaveToDisk()
    {
        try
        {
            lock (_lock)
            {
                var snapshot = new PersistedSnapshot
                {
                    Products = _products,
                    Users = _users,
                    Orders = _orders,
                    Coupons = _coupons,
                    Addresses = _addresses
                };
                var json = JsonSerializer.Serialize(snapshot, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_storageFilePath, json);
            }
        }
        catch { }
    }

    private void SeedInitialData(IPasswordHasher hasher)
    {
        var (adminHash, adminSalt) = hasher.HashPassword("Admin@123");
        var (userHash, userSalt) = hasher.HashPassword("Customer@123");

        _users.Add(new User
        {
            Id = "usr-1",
            Name = "Jay Vardhan",
            Email = "jay@novamart.com",
            Phone = "9876543210",
            PasswordHash = adminHash,
            PasswordSalt = adminSalt,
            Role = "Admin",
            Status = "Active",
            OrdersCount = 4
        });

        _users.Add(new User
        {
            Id = "usr-admin-2",
            Name = "NovaMart Administrator",
            Email = "admin@novamart.in",
            Phone = "9876543211",
            PasswordHash = adminHash,
            PasswordSalt = adminSalt,
            Role = "Admin",
            Status = "Active",
            OrdersCount = 0
        });

        _users.Add(new User
        {
            Id = "usr-2",
            Name = "Priya Sharma",
            Email = "priya@gmail.com",
            Phone = "9811223344",
            PasswordHash = userHash,
            PasswordSalt = userSalt,
            Role = "Customer",
            Status = "Active",
            OrdersCount = 2
        });

        _users.Add(new User
        {
            Id = "usr-3",
            Name = "Arun Patel",
            Email = "arun.patel@gmail.com",
            Phone = "9876501234",
            PasswordHash = userHash,
            PasswordSalt = userSalt,
            Role = "Customer",
            Status = "Active",
            OrdersCount = 1
        });

        _coupons.AddRange(new[]
        {
            new Coupon { Code = "NOVA20", DiscountPercent = 20, Description = "20% off on your entire cart", UsageCount = 142, Validity = "31 Dec 2026" },
            new Coupon { Code = "WELCOME100", DiscountFlat = 100, MinCart = 500, Description = "₹100 flat discount on welcome orders over ₹500", UsageCount = 120, Validity = "31 Dec 2026" },
            new Coupon { Code = "FESTIVE20", DiscountPercent = 20, MinCart = 1000, Description = "20% festive discount on orders above ₹1000", UsageCount = 95, Validity = "31 Dec 2026" },
            new Coupon { Code = "FIRST100", DiscountFlat = 100, MinCart = 500, Description = "₹100 flat discount on orders over ₹500", UsageCount = 89, Validity = "30 Nov 2026" },
            new Coupon { Code = "FESTIVE500", DiscountFlat = 500, MinCart = 2000, Description = "₹500 festive discount on orders above ₹2000", UsageCount = 65, Validity = "15 Oct 2026" }
        });

        _addresses.AddRange(new[]
        {
            new SavedAddress { Id = "addr-1", UserEmail = "jay@novamart.com", Tag = "Home", Name = "Jay Vardhan", Phone = "9876543210", Street = "Flat 402, Lotus Heights, Outer Ring Road", City = "Bengaluru", State = "Karnataka", Pin = "560103", IsDefault = true },
            new SavedAddress { Id = "addr-2", UserEmail = "jay@novamart.com", Tag = "Work", Name = "Jay Vardhan", Phone = "9876543210", Street = "Building 7B, Embassy TechVillage", City = "Bengaluru", State = "Karnataka", Pin = "560103", IsDefault = false },
            new SavedAddress { Id = "addr-3", UserEmail = "admin@novamart.in", Tag = "HQ", Name = "NovaMart Admin", Phone = "9876543211", Street = "Level 8, Nova Tower, Cyber City", City = "Bengaluru", State = "Karnataka", Pin = "560001", IsDefault = true },
            new SavedAddress { Id = "addr-4", UserEmail = "arun.patel@gmail.com", Tag = "Home", Name = "Arun Patel", Phone = "9876501234", Street = "Flat 302, Skyline Residency, Koramangala 4th Block", City = "Bengaluru", State = "Karnataka", Pin = "560034", IsDefault = true },
            new SavedAddress { Id = "addr-5", UserEmail = "arun.patel@gmail.com", Tag = "Work", Name = "Arun Patel", Phone = "9876501234", Street = "Indiranagar 100ft Road, Stage 2", City = "Bengaluru", State = "Karnataka", Pin = "560038", IsDefault = false }
        });

        _orders.AddRange(new[]
        {
            new Order
            {
                Id = "NM-982410",
                Date = "10 Sep 2026",
                Customer = "Jay Vardhan",
                Email = "jay@novamart.com",
                Phone = "9876543210",
                Address = "Flat 402, Lotus Heights, Bengaluru - 560103",
                Status = "Shipped",
                TrackingId = "TRK-IN-88992",
                DeliverySpeed = "Standard Free",
                Subtotal = 14999,
                Discount = 0,
                DeliveryFee = 0,
                Tax = 750,
                Total = 14999,
                Items = new List<OrderItem>
                {
                    new() { ProductId = "prod-2", Title = "SonicWave Elite Active Noise Cancelling Headphones", Qty = 1, Price = 14999, Img = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" }
                }
            },
            new Order
            {
                Id = "NM-981042",
                Date = "02 Sep 2026",
                Customer = "Priya Sharma",
                Email = "priya@gmail.com",
                Phone = "9811223344",
                Address = "12 Brigade Road, Bengaluru - 560001",
                Status = "Delivered",
                TrackingId = "TRK-IN-77123",
                DeliverySpeed = "Express Next-Day",
                Subtotal = 2499,
                Discount = 0,
                DeliveryFee = 99,
                Tax = 125,
                Total = 2499,
                Items = new List<OrderItem>
                {
                    new() { ProductId = "prod-8", Title = "UrbanStride Breathable Athletic Running Sneakers", Qty = 1, Price = 2499, Img = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80" }
                }
            }
        });

        _products.AddRange(new[]
        {
            new Product
            {
                Id = "prod-1",
                Title = "NovaPro 15 Ultra 5G (Phantom Titanium, 256 GB)",
                Category = "mobiles",
                Brand = "NovaTech",
                Price = 69999,
                Mrp = 84999,
                Discount = 18,
                Rating = 4.8,
                RatingCount = 14230,
                ReviewsCount = 2840,
                InStock = true,
                StockCount = 24,
                Badge = "Trending Deal",
                Images = new()
                {
                    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
                },
                Variants = new()
                {
                    Color = new() { "Phantom Titanium", "Deep Ocean Blue", "Midnight Obsidian" },
                    Storage = new() { "128 GB", "256 GB", "512 GB" }
                },
                Description = "Experience ultra-fast 5G connectivity with the flagship NovaPro 15 Ultra. Featuring a 6.8-inch Dynamic AMOLED 120Hz display, ProGrade 200MP camera system, and all-day 5000mAh battery with 68W fast charge.",
                Specs = new()
                {
                    new() { Key = "Processor", Value = "Octa-Core Snapdragon 8 Gen 3" },
                    new() { Key = "Display", Value = "6.8-inch QHD+ 120Hz Dynamic AMOLED" },
                    new() { Key = "Camera", Value = "200MP Main + 50MP Periscope + 12MP Ultra-wide" },
                    new() { Key = "Battery", Value = "5000 mAh with 68W HyperCharge" }
                },
                Offers = new()
                {
                    "Bank Offer: Flat ₹4,000 instant discount on HDFC Bank Credit Cards",
                    "Special Price: Get extra 10% off (price inclusive of discount)",
                    "No Cost EMI available from ₹5,833/month"
                },
                Reviews = new()
                {
                    new() { Author = "Vikram Mehta", Rating = 5, Date = "05 Sep 2026", Title = "Absolute powerhouse phone!", Text = "Camera quality matches DSLRs and the battery easily lasts 1.5 days." }
                }
            },
            new Product
            {
                Id = "prod-2",
                Title = "SonicWave Elite Active Noise Cancelling Headphones",
                Category = "electronics",
                Brand = "SonicWave",
                Price = 14999,
                Mrp = 24999,
                Discount = 40,
                Rating = 4.6,
                RatingCount = 8430,
                ReviewsCount = 1210,
                InStock = true,
                StockCount = 42,
                Badge = "Super Saver",
                Images = new()
                {
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
                },
                Variants = new() { Color = new() { "Matte Black", "Silver Frost", "Midnight Navy" } },
                Description = "Premium wireless headphones with industry-leading hybrid ANC, 40-hour playtime, Hi-Res LDAC audio decoding, and ultra-plush memory foam earcups.",
                Specs = new()
                {
                    new() { Key = "Driver Size", Value = "40mm Custom Titanium Drivers" },
                    new() { Key = "Battery Life", Value = "40 Hours (ANC on)" },
                    new() { Key = "Connectivity", Value = "Bluetooth 5.3 + 3.5mm Aux" }
                },
                Offers = new() { "Apply coupon NOVA20 for an extra 20% off at checkout" },
                Reviews = new()
                {
                    new() { Author = "Karan Malhotra", Rating = 5, Date = "08 Sep 2026", Title = "Noise cancellation is magic", Text = "Blocks out all airplane drone and office chatter effortlessly." }
                }
            },
            new Product
            {
                Id = "prod-3",
                Title = "AuraCraft Pure Cotton Casual Slim Fit Shirt",
                Category = "fashion",
                Brand = "AuraCraft",
                Price = 1299,
                Mrp = 2999,
                Discount = 57,
                Rating = 4.4,
                RatingCount = 3120,
                ReviewsCount = 520,
                InStock = true,
                StockCount = 80,
                Badge = "Bestseller",
                Images = new() { "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" },
                Variants = new() { Size = new() { "S", "M", "L", "XL", "XXL" } },
                Description = "Tailored to perfection from 100% breathable organic combed cotton.",
                Specs = new()
                {
                    new() { Key = "Material", Value = "100% Combed Organic Cotton" },
                    new() { Key = "Fit", Value = "Modern Slim Fit" }
                },
                Offers = new() { "Buy 2 Get Additional 15% Off automatically in Cart" },
                Reviews = new()
                {
                    new() { Author = "Rohan Joshi", Rating = 5, Date = "04 Sep 2026", Title = "Perfect office shirt", Text = "Fabric has a great handfeel and does not wrinkle easily." }
                }
            },
            new Product
            {
                Id = "prod-4",
                Title = "MasterChef Smart Rapid Air Fryer (5.5 Liters, 1500W)",
                Category = "home",
                Brand = "MasterChef",
                Price = 5499,
                Mrp = 9999,
                Discount = 45,
                Rating = 4.7,
                RatingCount = 5690,
                ReviewsCount = 940,
                InStock = true,
                StockCount = 15,
                Badge = "Limited Stock",
                Images = new() { "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=800&q=80" },
                Description = "Crisp, healthy meals with up to 90% less oil.",
                Specs = new()
                {
                    new() { Key = "Capacity", Value = "5.5 Liters (serves 4-6)" },
                    new() { Key = "Power", Value = "1500 Watts High Efficiency" }
                },
                Offers = new() { "Complimentary Recipe E-Book with 100+ Chef Recipes" },
                Reviews = new()
                {
                    new() { Author = "Deepa Narang", Rating = 5, Date = "02 Sep 2026", Title = "Crispy samosas without oil!", Text = "Best kitchen purchase this year." }
                }
            },
            new Product
            {
                Id = "prod-5",
                Title = "FrostKing 340L Double Door Inverter Refrigerator",
                Category = "appliances",
                Brand = "FrostKing",
                Price = 32490,
                Mrp = 44990,
                Discount = 28,
                Rating = 4.5,
                RatingCount = 2190,
                ReviewsCount = 380,
                InStock = false,
                StockCount = 0,
                Badge = "Out of Stock",
                Images = new() { "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80" },
                Description = "Advanced 3-Star energy rated Frost-Free double door refrigerator.",
                Specs = new()
                {
                    new() { Key = "Capacity", Value = "340 Liters" },
                    new() { Key = "Energy Rating", Value = "3 Star (BEE Compliant)" }
                },
                Offers = new() { "Free scheduled installation by brand technician" },
                Reviews = new()
                {
                    new() { Author = "Rajesh Nair", Rating = 4, Date = "15 Aug 2026", Title = "Silent and cools fast", Text = "Hardly makes any noise." }
                }
            },
            new Product
            {
                Id = "prod-6",
                Title = "GlowRadiance 10% Niacinamide & Zinc Face Serum (30ml)",
                Category = "beauty",
                Brand = "GlowRadiance",
                Price = 599,
                Mrp = 999,
                Discount = 40,
                Rating = 4.9,
                RatingCount = 19800,
                ReviewsCount = 4520,
                InStock = true,
                StockCount = 120,
                Badge = "Dermatologist Approved",
                Images = new() { "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80" },
                Description = "Clinically formulated to visibly minimize pores and fade dark spots.",
                Specs = new() { new() { Key = "Key Ingredients", Value = "10% Pure Niacinamide + 1% Zinc PCA" } },
                Offers = new() { "Buy 3 Pay for 2 Combo offer automatically applied" },
                Reviews = new()
                {
                    new() { Author = "Kavita Singh", Rating = 5, Date = "07 Sep 2026", Title = "Cleared my stubborn marks", Text = "Visible difference in 2 weeks." }
                }
            }
        });
    }

    // Products Implementation
    public Task<IEnumerable<Product>> GetProductsAsync(string? category = null, string? brand = null, string? search = null, decimal? maxPrice = null, bool inStockOnly = false, double? minRating = null, string? sort = null)
    {
        lock (_lock)
        {
            var query = _products.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(category) && category != "all")
                query = query.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(brand))
                query = query.Where(p => p.Brand.Equals(brand, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLowerInvariant();
                query = query.Where(p => p.Title.ToLowerInvariant().Contains(s) ||
                                         p.Brand.ToLowerInvariant().Contains(s) ||
                                         p.Category.ToLowerInvariant().Contains(s));
            }

            if (maxPrice.HasValue)
                query = query.Where(p => p.Price <= maxPrice.Value);

            if (inStockOnly)
                query = query.Where(p => p.InStock);

            if (minRating.HasValue && minRating.Value > 0)
                query = query.Where(p => p.Rating >= minRating.Value);

            query = sort switch
            {
                "price-low" => query.OrderBy(p => p.Price),
                "price-high" => query.OrderByDescending(p => p.Price),
                "rating" => query.OrderByDescending(p => p.Rating),
                "discount" => query.OrderByDescending(p => p.Discount),
                _ => query
            };

            return Task.FromResult<IEnumerable<Product>>(query.ToList());
        }
    }

    public Task<Product?> GetProductByIdAsync(string id)
    {
        lock (_lock)
        {
            var product = _products.FirstOrDefault(p => p.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(product);
        }
    }

    public Task<Product> CreateProductAsync(Product product)
    {
        lock (_lock)
        {
            if (string.IsNullOrEmpty(product.Id))
                product.Id = "prod-" + (_products.Count + 1);
            _products.Insert(0, product);
            SaveToDisk();
            return Task.FromResult(product);
        }
    }

    public Task<bool> UpdateProductAsync(Product product)
    {
        lock (_lock)
        {
            var idx = _products.FindIndex(p => p.Id == product.Id);
            if (idx == -1) return Task.FromResult(false);
            _products[idx] = product;
            SaveToDisk();
            return Task.FromResult(true);
        }
    }

    public Task<bool> DeleteProductAsync(string id)
    {
        lock (_lock)
        {
            var count = _products.RemoveAll(p => p.Id == id);
            if (count > 0) SaveToDisk();
            return Task.FromResult(count > 0);
        }
    }

    public Task<bool> AddProductReviewAsync(string productId, ProductReview review)
    {
        lock (_lock)
        {
            var product = _products.FirstOrDefault(p => p.Id == productId);
            if (product == null) return Task.FromResult(false);

            product.Reviews.Insert(0, review);
            product.ReviewsCount += 1;
            SaveToDisk();
            return Task.FromResult(true);
        }
    }

    // Users Implementation
    public Task<User?> GetUserByEmailAsync(string email)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(user);
        }
    }

    public Task<User?> GetUserByIdAsync(string id)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            return Task.FromResult(user);
        }
    }

    public Task<User> CreateUserAsync(User user)
    {
        lock (_lock)
        {
            if (string.IsNullOrEmpty(user.Id))
                user.Id = "usr-" + (_users.Count + 1);
            _users.Add(user);
            SaveToDisk();
            return Task.FromResult(user);
        }
    }

    public Task<IEnumerable<User>> GetUsersAsync()
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<User>>(_users.ToList());
        }
    }

    public Task<bool> UpdateUserStatusAsync(string id, string status)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null) return Task.FromResult(false);
            user.Status = status;
            SaveToDisk();
            return Task.FromResult(true);
        }
    }

    // Orders Implementation
    public Task<IEnumerable<Order>> GetAllOrdersAsync()
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<Order>>(_orders.OrderByDescending(o => o.Id).ToList());
        }
    }

    public Task<IEnumerable<Order>> GetCustomerOrdersAsync(string email)
    {
        lock (_lock)
        {
            var userOrders = _orders.Where(o => o.Email.Equals(email, StringComparison.OrdinalIgnoreCase)).ToList();
            return Task.FromResult<IEnumerable<Order>>(userOrders);
        }
    }

    public Task<Order?> GetOrderByIdAsync(string id)
    {
        lock (_lock)
        {
            var order = _orders.FirstOrDefault(o => o.Id == id);
            return Task.FromResult(order);
        }
    }

    public Task<Order> CreateOrderAsync(Order order)
    {
        lock (_lock)
        {
            if (string.IsNullOrEmpty(order.Id))
                order.Id = "NM-" + Random.Shared.Next(100000, 999999);
            if (string.IsNullOrEmpty(order.TrackingId))
                order.TrackingId = "TRK-IN-" + Random.Shared.Next(10000, 99999);
            _orders.Insert(0, order);

            // Increment user order count
            var user = _users.FirstOrDefault(u => u.Email.Equals(order.Email, StringComparison.OrdinalIgnoreCase));
            if (user != null) user.OrdersCount += 1;

            SaveToDisk();
            return Task.FromResult(order);
        }
    }

    public Task<bool> UpdateOrderStatusAsync(string id, string status, string? trackingId)
    {
        lock (_lock)
        {
            var order = _orders.FirstOrDefault(o => o.Id == id);
            if (order == null) return Task.FromResult(false);
            order.Status = status;
            if (!string.IsNullOrEmpty(trackingId)) order.TrackingId = trackingId;
            SaveToDisk();
            return Task.FromResult(true);
        }
    }

    // Coupons Implementation
    public Task<IEnumerable<Coupon>> GetCouponsAsync()
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<Coupon>>(_coupons.ToList());
        }
    }

    public Task<Coupon?> GetCouponByCodeAsync(string code)
    {
        lock (_lock)
        {
            var c = _coupons.FirstOrDefault(x => x.Code.Equals(code, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(c);
        }
    }

    public Task<Coupon> CreateCouponAsync(Coupon coupon)
    {
        lock (_lock)
        {
            coupon.Code = coupon.Code.ToUpperInvariant();
            var existing = _coupons.FirstOrDefault(c => c.Code == coupon.Code);
            if (existing != null) _coupons.Remove(existing);
            _coupons.Add(coupon);
            SaveToDisk();
            return Task.FromResult(coupon);
        }
    }

    public Task<bool> DeleteCouponAsync(string code)
    {
        lock (_lock)
        {
            var count = _coupons.RemoveAll(c => c.Code.Equals(code, StringComparison.OrdinalIgnoreCase));
            if (count > 0) SaveToDisk();
            return Task.FromResult(count > 0);
        }
    }

    // Saved Addresses Implementation
    public Task<IEnumerable<SavedAddress>> GetAddressesByUserAsync(string email)
    {
        lock (_lock)
        {
            var list = _addresses.Where(a => a.UserEmail.Equals(email, StringComparison.OrdinalIgnoreCase)).ToList();
            return Task.FromResult<IEnumerable<SavedAddress>>(list);
        }
    }

    public Task<SavedAddress> CreateAddressAsync(SavedAddress address)
    {
        lock (_lock)
        {
            if (string.IsNullOrEmpty(address.Id))
                address.Id = "addr-" + (_addresses.Count + 1);
            _addresses.Add(address);
            SaveToDisk();
            return Task.FromResult(address);
        }
    }

    public Task<bool> SetDefaultAddressAsync(string email, string addressId)
    {
        lock (_lock)
        {
            foreach (var a in _addresses.Where(x => x.UserEmail.Equals(email, StringComparison.OrdinalIgnoreCase)))
            {
                a.IsDefault = (a.Id == addressId);
            }
            SaveToDisk();
            return Task.FromResult(true);
        }
    }

    public Task<bool> DeleteAddressAsync(string id)
    {
        lock (_lock)
        {
            var count = _addresses.RemoveAll(a => a.Id == id);
            if (count > 0) SaveToDisk();
            return Task.FromResult(count > 0);
        }
    }

    // Cart & Wishlist Implementation
    public Task<UserCart> GetCartAsync(string email)
    {
        lock (_lock)
        {
            if (!_carts.TryGetValue(email, out var cart))
            {
                cart = new UserCart { UserEmail = email };
                _carts[email] = cart;
            }
            return Task.FromResult(cart);
        }
    }

    public Task<bool> SaveCartAsync(UserCart cart)
    {
        lock (_lock)
        {
            _carts[cart.UserEmail] = cart;
            return Task.FromResult(true);
        }
    }

    public Task<UserWishlist> GetWishlistAsync(string email)
    {
        lock (_lock)
        {
            if (!_wishlists.TryGetValue(email, out var w))
            {
                w = new UserWishlist { UserEmail = email };
                _wishlists[email] = w;
            }
            return Task.FromResult(w);
        }
    }

    public Task<bool> SaveWishlistAsync(UserWishlist wishlist)
    {
        lock (_lock)
        {
            _wishlists[wishlist.UserEmail] = wishlist;
            return Task.FromResult(true);
        }
    }
}

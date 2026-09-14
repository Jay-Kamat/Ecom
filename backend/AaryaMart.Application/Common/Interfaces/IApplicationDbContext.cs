using Microsoft.EntityFrameworkCore;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Product> Products { get; }
    DbSet<Order> Orders { get; }
    DbSet<User> Users { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<SavedAddress> SavedAddresses { get; }
    DbSet<UserCart> UserCarts { get; }
    DbSet<UserWishlist> UserWishlists { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

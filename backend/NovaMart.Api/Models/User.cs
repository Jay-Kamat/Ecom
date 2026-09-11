using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace NovaMart.Api.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer"; // "Customer" or "Admin"
    public string Status { get; set; } = "Active"; // "Active" or "Disabled"
    public int OrdersCount { get; set; } = 0;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

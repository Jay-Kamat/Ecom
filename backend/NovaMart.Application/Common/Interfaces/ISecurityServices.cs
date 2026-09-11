using NovaMart.Domain.Entities;

namespace NovaMart.Application.Common.Interfaces;

public interface IPasswordHasher
{
    (string hash, string salt) HashPassword(string password);
    bool VerifyPassword(string password, string hash, string salt);
}

public interface ITokenService
{
    string GenerateToken(User user);
}

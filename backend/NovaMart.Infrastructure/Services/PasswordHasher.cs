using System.Security.Cryptography;
using NovaMart.Application.Common.Interfaces;

namespace NovaMart.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 128 / 8; // 16 bytes
    private const int KeySize = 256 / 8;  // 32 bytes
    private const int Iterations = 100000;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    public (string hash, string salt) HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password: password,
            salt: salt,
            iterations: Iterations,
            hashAlgorithm: Algorithm,
            outputLength: KeySize);

        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    public bool VerifyPassword(string password, string hash, string salt)
    {
        if (string.IsNullOrEmpty(hash) || string.IsNullOrEmpty(salt))
            return false;

        byte[] saltBytes;
        byte[] storedHashBytes;

        try
        {
            saltBytes = Convert.FromBase64String(salt);
            storedHashBytes = Convert.FromBase64String(hash);
        }
        catch
        {
            return false;
        }

        byte[] computedHash = Rfc2898DeriveBytes.Pbkdf2(
            password: password,
            salt: saltBytes,
            iterations: Iterations,
            hashAlgorithm: Algorithm,
            outputLength: KeySize);

        return CryptographicOperations.FixedTimeEquals(computedHash, storedHashBytes);
    }
}

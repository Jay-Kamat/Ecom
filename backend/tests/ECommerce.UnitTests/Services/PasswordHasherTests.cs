using ECommerce.Infrastructure.Services;
using FluentAssertions;
using Xunit;

namespace ECommerce.UnitTests.Services;

public class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void HashPassword_Should_GenerateUniqueSaltAndNonEmptyHash()
    {
        // Act
        var hash1 = _hasher.HashPassword("TestPass@123", out var salt1);
        var hash2 = _hasher.HashPassword("TestPass@123", out var salt2);

        // Assert
        hash1.Should().NotBeNullOrWhiteSpace();
        salt1.Should().NotBeNullOrWhiteSpace();
        salt2.Should().NotBeNullOrWhiteSpace();
        salt1.Should().NotBe(salt2, "Each password hash should use a unique cryptographic salt");
        hash1.Should().NotBe(hash2, "Hashes with distinct salts should differ");
    }

    [Fact]
    public void VerifyPassword_Should_ReturnTrue_ForCorrectPassword()
    {
        // Arrange
        const string password = "SecretPassword!#2026";
        var hash = _hasher.HashPassword(password, out var salt);

        // Act
        var isValid = _hasher.VerifyPassword(password, hash, salt);

        // Assert
        isValid.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_Should_ReturnFalse_ForIncorrectPassword()
    {
        // Arrange
        const string password = "CorrectPassword123";
        var hash = _hasher.HashPassword(password, out var salt);

        // Act
        var isValid = _hasher.VerifyPassword("WrongPassword123", hash, salt);

        // Assert
        isValid.Should().BeFalse();
    }
}

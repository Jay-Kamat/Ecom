using ECommerce.Application.Common.Security;
using ECommerce.Application.Common.Validators;
using ECommerce.Application.DTOs;
using ECommerce.Application.Features.Auth;
using ECommerce.Infrastructure.Services;
using FluentAssertions;
using Xunit;

namespace ECommerce.UnitTests.Security;

public class SecurityTests
{
    [Theory]
    [InlineData("<script>alert('xss')</script>Hello", "Hello")]
    [InlineData("<img src=x onerror=alert(1)><b>bold</b>", "bold")]
    [InlineData("javascript:alert(1)", "alert(1)")]
    public void SanitizeText_Should_StripMaliciousPayloads(string input, string expected)
    {
        // Act
        var result = SecuritySanitizer.SanitizeText(input);

        // Assert
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData("http://localhost:5000/api", false)]
    [InlineData("http://127.0.0.1:8080", false)]
    [InlineData("http://10.0.0.1/secret", false)]
    [InlineData("http://192.168.1.1/admin", false)]
    [InlineData("http://172.16.0.1/internal", false)]
    [InlineData("ftp://example.com/file", false)]
    [InlineData("https://images.unsplash.com/photo-1", true)]
    public void IsSafeExternalUrl_Should_DefendAgainstSSRF(string url, bool expectedSafe)
    {
        // Act
        var isSafe = SecuritySanitizer.IsSafeExternalUrl(url);

        // Assert
        isSafe.Should().Be(expectedSafe);
    }

    [Fact]
    public void SanitizeSearchQuery_Should_EscapeWildcards()
    {
        // Arrange
        const string query = "%drop_table%";

        // Act
        var sanitized = SecuritySanitizer.SanitizeSearchQuery(query);

        // Assert
        sanitized.Should().Be(@"\%drop\_table\%");
    }

    [Fact]
    public void IsValidImageHeader_Should_DetectMismatchedMagicBytes()
    {
        // Malicious fake image: ASCII text "<?php phpinfo();" disguised as .jpg
        var fakeJpgHeader = new byte[] { 0x3C, 0x3F, 0x70, 0x68, 0x70 };
        LocalFileStorageService.IsValidImageHeader(fakeJpgHeader, 5, ".jpg")
            .Should().BeFalse("PHP script header disguised as .jpg must be rejected");

        // Genuine JPEG header
        var realJpgHeader = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 };
        LocalFileStorageService.IsValidImageHeader(realJpgHeader, 6, ".jpg")
            .Should().BeTrue("Valid JPEG magic bytes must be accepted");

        // Genuine PNG header
        var realPngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        LocalFileStorageService.IsValidImageHeader(realPngHeader, 8, ".png")
            .Should().BeTrue("Valid PNG magic bytes must be accepted");

        // Mismatched extension: PNG bytes with .jpg extension
        LocalFileStorageService.IsValidImageHeader(realPngHeader, 8, ".jpg")
            .Should().BeFalse("PNG bytes with .jpg extension must be rejected");
    }

    [Theory]
    [InlineData("short", false)] // < 8 chars
    [InlineData("nouppercase123!", false)] // missing uppercase
    [InlineData("NOLOWERCASE123!", false)] // missing lowercase
    [InlineData("NoNumberHere!!", false)] // missing number
    [InlineData("NoSpecialChar123", false)] // missing special char
    [InlineData("EnterpriseSecure@2026", true)] // valid strong password
    public void RegisterCommandValidator_Should_EnforceStrongPasswordPolicy(string password, bool shouldPass)
    {
        // Arrange
        var validator = new RegisterCommandValidator();
        var command = new RegisterCommand(new RegisterRequestDto
        {
            Name = "John Doe",
            Email = "john.doe@example.com",
            Password = password
        });

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().Be(shouldPass);
    }
}

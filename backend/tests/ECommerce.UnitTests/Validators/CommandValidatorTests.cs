using ECommerce.Application.Common.Validators;
using ECommerce.Application.DTOs;
using ECommerce.Application.Features.Auth;
using ECommerce.Application.Features.Cart.Commands;
using ECommerce.Application.Features.Orders.Commands;
using ECommerce.Application.Features.Products.Commands;
using FluentAssertions;
using Xunit;

namespace ECommerce.UnitTests.Validators;

public class CommandValidatorTests
{
    [Theory]
    [InlineData("", "ValidPass123", false)]
    [InlineData("not-an-email", "ValidPass123", false)]
    [InlineData("valid@example.com", "", false)]
    [InlineData("valid@example.com", "ValidPass123", true)]
    public void LoginCommandValidator_Should_ValidateEmailAndPassword(string email, string password, bool shouldBeValid)
    {
        // Arrange
        var validator = new LoginCommandValidator();
        var command = new LoginCommand(new LoginRequestDto
        {
            Email = email,
            Password = password
        });

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().Be(shouldBeValid);
    }

    [Theory]
    [InlineData("NovaPhone", 999.99, 10, true)]
    [InlineData("", 999.99, 10, false)] // empty name
    [InlineData("NovaPhone", 0, 10, false)] // zero price
    [InlineData("NovaPhone", -10, 10, false)] // negative price
    [InlineData("NovaPhone", 100, -1, false)] // negative stock
    public void CreateProductCommandValidator_Should_ValidateInputs(string name, decimal price, int stock, bool shouldBeValid)
    {
        // Arrange
        var validator = new CreateProductCommandValidator();
        var command = new CreateProductCommand(new CreateProductDto
        {
            Name = name,
            Price = price,
            StockQuantity = stock
        });

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().Be(shouldBeValid);
    }

    [Fact]
    public void CreateOrderCommandValidator_Should_Fail_WhenItemsAreEmpty()
    {
        // Arrange
        var validator = new CreateOrderCommandValidator();
        var command = new CreateOrderCommand(new CreateOrderDto
        {
            Customer = "John Doe",
            Email = "john@example.com",
            Address = "123 Main Street",
            Items = new List<CreateOrderItemDto>()
        });

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "OrderDto.Items");
    }

    [Fact]
    public void AddToCartCommandValidator_Should_ValidateRequiredFields()
    {
        // Arrange
        var validator = new AddToCartCommandValidator();
        var invalidCommand = new AddToCartCommand("not-an-email", "", 0);

        // Act
        var result = validator.Validate(invalidCommand);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCount(3);
    }
}

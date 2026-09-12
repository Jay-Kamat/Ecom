using ECommerce.Shared.Common;
using FluentAssertions;
using Xunit;

namespace ECommerce.UnitTests.Common;

public class ResultTests
{
    [Fact]
    public void Success_Should_SetIsSuccessTrue_AndErrorNone()
    {
        // Act
        var result = Result.Success();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Error.Should().Be(Error.None);
    }

    [Fact]
    public void Failure_Should_SetIsFailureTrue_AndRetainError()
    {
        // Arrange
        var error = Error.NotFound("Product.NotFound", "The product was not found.");

        // Act
        var result = Result.Failure(error);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(error);
    }

    [Fact]
    public void TypedResult_Success_Should_ReturnProvidedValue()
    {
        // Arrange
        const string expectedValue = "SuccessPayload";

        // Act
        var result = Result.Success(expectedValue);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(expectedValue);
    }

    [Fact]
    public void TypedResult_Failure_Should_ThrowException_WhenAccessingValue()
    {
        // Arrange
        var error = Error.Validation("Input.Invalid", "Invalid format.");
        var result = Result.Failure<string>(error);

        // Act
        var act = () => _ = result.Value;

        // Assert
        result.IsFailure.Should().BeTrue();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("The value of a failure result can not be accessed.");
    }

    [Fact]
    public void ImplicitOperator_Should_WrapNonNullValueInSuccessResult()
    {
        // Act
        Result<int> result = 42;

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(42);
    }

    [Fact]
    public void ImplicitOperator_Should_WrapNullInFailureResult()
    {
        // Act
        Result<string?> result = (string?)null;

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(Error.NullValue);
    }
}

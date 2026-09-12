using FluentAssertions;
using NetArchTest.Rules;
using Xunit;

namespace ECommerce.ArchitectureTests;

public class ArchitectureTests
{
    private const string DomainNamespace = "ECommerce.Domain";
    private const string ApplicationNamespace = "ECommerce.Application";
    private const string InfrastructureNamespace = "ECommerce.Infrastructure";
    private const string ApiNamespace = "ECommerce.API";

    [Fact]
    public void Domain_Should_Not_HaveDependencyOn_OtherProjects()
    {
        // Arrange
        var assembly = typeof(Domain.Entities.Product).Assembly;

        var otherProjects = new[]
        {
            ApplicationNamespace,
            InfrastructureNamespace,
            ApiNamespace
        };

        // Act
        var result = Types
            .InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOnAny(otherProjects)
            .GetResult();

        // Assert
        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Application_Should_Not_HaveDependencyOn_InfrastructureOrApi()
    {
        // Arrange
        var assembly = typeof(Application.DependencyInjection).Assembly;

        var forbiddenProjects = new[]
        {
            InfrastructureNamespace,
            ApiNamespace
        };

        // Act
        var result = Types
            .InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOnAny(forbiddenProjects)
            .GetResult();

        // Assert
        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void Infrastructure_Should_Not_HaveDependencyOn_Api()
    {
        // Arrange
        var assembly = typeof(Infrastructure.DependencyInjection).Assembly;

        // Act
        var result = Types
            .InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOn(ApiNamespace)
            .GetResult();

        // Assert
        result.IsSuccessful.Should().BeTrue();
    }
}

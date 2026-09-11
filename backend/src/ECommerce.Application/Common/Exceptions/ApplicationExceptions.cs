namespace ECommerce.Application.Common.Exceptions;

public class ApplicationExceptionBase : Exception
{
    public ApplicationExceptionBase(string message) : base(message) { }
    public ApplicationExceptionBase(string message, Exception innerException) : base(message, innerException) { }
}

public class NotFoundException : ApplicationExceptionBase
{
    public NotFoundException(string name, object key)
        : base($"Entity \"{name}\" ({key}) was not found.")
    {
    }

    public NotFoundException(string message) : base(message) { }
}

public class ValidationException : ApplicationExceptionBase
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException()
        : base("One or more validation failures have occurred.")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IEnumerable<FluentValidation.Results.ValidationFailure> failures)
        : this()
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(failureGroup => failureGroup.Key, failureGroup => failureGroup.ToArray());
    }

    public ValidationException(string propertyName, string errorMessage)
        : this()
    {
        Errors.Add(propertyName, new[] { errorMessage });
    }
}

public class UnauthorizedException : ApplicationExceptionBase
{
    public UnauthorizedException(string message = "Unauthorized access") : base(message) { }
}

public class ConflictException : ApplicationExceptionBase
{
    public ConflictException(string message) : base(message) { }
}

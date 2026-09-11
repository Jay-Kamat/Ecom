using ECommerce.Shared.Common;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

/// <summary>Base controller providing Result-to-HTTP mapping helpers.</summary>
[ApiController]
public abstract class ApiBaseController : ControllerBase
{
    protected IActionResult OkOrError<T>(Result<T> result) =>
        result.IsSuccess ? Ok(result.Value) : Problem(result.Error);

    protected IActionResult CreatedOrError<T>(Result<T> result, string actionName, object routeValues) =>
        result.IsSuccess ? CreatedAtAction(actionName, routeValues, result.Value) : Problem(result.Error);

    protected IActionResult NoContentOrError(Result result) =>
        result.IsSuccess ? NoContent() : Problem(result.Error);

    private IActionResult Problem(Error error) => error.Code switch
    {
        var c when c.Contains("NotFound") => NotFound(new { error = error.Code, message = error.Description }),
        var c when c.Contains("Unauthorized") => Unauthorized(new { error = error.Code, message = error.Description }),
        var c when c.Contains("Conflict") => Conflict(new { error = error.Code, message = error.Description }),
        _ => BadRequest(new { error = error.Code, message = error.Description })
    };
}

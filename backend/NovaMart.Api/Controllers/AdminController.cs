using MediatR;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Application.Features.Admin.Commands;
using NovaMart.Application.Features.Admin.Queries;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly ISender _mediator;

    public AdminController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("kpis")]
    public async Task<ActionResult<AdminKpisDto>> GetKpis()
    {
        var kpis = await _mediator.Send(new GetAdminKpisQuery());
        return Ok(kpis);
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
    {
        var users = await _mediator.Send(new GetAdminUsersQuery());
        return Ok(users);
    }

    public record UpdateStatusRequestDto(string Status = "Active");

    [HttpPut("users/{id}/status")]
    public async Task<ActionResult> UpdateUserStatus(string id, [FromBody] UpdateStatusRequestDto req)
    {
        var success = await _mediator.Send(new UpdateUserStatusCommand(id, req.Status));
        if (!success)
            return NotFound(new { message = $"User with ID '{id}' not found." });

        return Ok(new { message = $"User status updated to '{req.Status}'.", userId = id, status = req.Status });
    }
}

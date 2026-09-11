using ECommerce.Application.Features.Admin;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;
    public AdminController(IMediator mediator) => _mediator = mediator;

    // GET api/admin/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken ct)
    {
        var kpis = await _mediator.Send(new GetAdminKpisQuery(), ct);
        var users = await _mediator.Send(new GetAdminUsersQuery(), ct);
        return Ok(new { kpis, users });
    }

    // GET api/admin/kpis
    [HttpGet("kpis")]
    public async Task<IActionResult> Kpis(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAdminKpisQuery(), ct);
        return Ok(result);
    }
}

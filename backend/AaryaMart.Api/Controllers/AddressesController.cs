using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using AaryaMart.Application.Features.Addresses.Commands;
using AaryaMart.Application.Features.Addresses.Queries;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AddressesController : ControllerBase
{
    private readonly ISender _mediator;

    public AddressesController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SavedAddress>>> GetAddresses([FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email ?? "arun.patel@gmail.com";
        var addresses = await _mediator.Send(new GetAddressesQuery(userEmail));
        return Ok(addresses);
    }

    [HttpPost]
    public async Task<ActionResult<SavedAddress>> CreateAddress([FromBody] SavedAddress address)
    {
        if (string.IsNullOrWhiteSpace(address.Name) || string.IsNullOrWhiteSpace(address.Street) || string.IsNullOrWhiteSpace(address.Pin))
            return BadRequest(new { message = "Name, street address, and PIN code are required." });

        var userEmail = User.FindFirstValue(ClaimTypes.Email);
        var created = await _mediator.Send(new CreateAddressCommand(address, userEmail));
        return Ok(created);
    }

    [HttpPut("{id}/default")]
    public async Task<ActionResult> SetDefault(string id, [FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email ?? "arun.patel@gmail.com";
        var success = await _mediator.Send(new SetDefaultAddressCommand(id, userEmail));
        if (!success)
            return NotFound(new { message = $"Address with ID '{id}' not found." });

        return Ok(new { message = "Default address updated." });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await _mediator.Send(new DeleteAddressCommand(id));
        if (!success)
            return NotFound(new { message = $"Address with ID '{id}' not found." });

        return Ok(new { message = "Address deleted successfully." });
    }
}

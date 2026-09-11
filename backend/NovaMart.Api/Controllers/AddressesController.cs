using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Api.Models;
using NovaMart.Api.Repositories;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AddressesController : ControllerBase
{
    private readonly IDataStore _dataStore;

    public AddressesController(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SavedAddress>>> GetAddresses([FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email ?? "arun.patel@gmail.com";
        var addresses = await _dataStore.GetAddressesByUserAsync(userEmail.Trim().ToLowerInvariant());
        return Ok(addresses);
    }

    [HttpPost]
    public async Task<ActionResult<SavedAddress>> CreateAddress([FromBody] SavedAddress address)
    {
        if (string.IsNullOrWhiteSpace(address.Name) || string.IsNullOrWhiteSpace(address.Street) || string.IsNullOrWhiteSpace(address.Pin))
            return BadRequest(new { message = "Name, street address, and PIN code are required." });

        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? address.UserEmail;
        if (string.IsNullOrWhiteSpace(userEmail))
            userEmail = "arun.patel@gmail.com";

        address.Id = "addr-" + Guid.NewGuid().ToString("N")[..8];
        address.UserEmail = userEmail.Trim().ToLowerInvariant();

        var created = await _dataStore.CreateAddressAsync(address);
        return Ok(created);
    }

    [HttpPut("{id}/default")]
    public async Task<ActionResult> SetDefault(string id, [FromQuery] string? email = null)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? email ?? "arun.patel@gmail.com";
        var success = await _dataStore.SetDefaultAddressAsync(userEmail.Trim().ToLowerInvariant(), id);
        if (!success)
            return NotFound(new { message = $"Address with ID '{id}' not found." });

        return Ok(new { message = "Default address updated." });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var deleted = await _dataStore.DeleteAddressAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Address with ID '{id}' not found." });

        return Ok(new { message = "Address deleted successfully." });
    }
}

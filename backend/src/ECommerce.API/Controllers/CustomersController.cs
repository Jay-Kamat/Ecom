using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.Features.Customers.Commands;
using ECommerce.Application.Features.Customers.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[Route("api/[controller]")]
[Authorize]
public class CustomersController : ApiBaseController
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public CustomersController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized();
        return OkOrError(await _mediator.Send(new GetCustomerByIdQuery(_currentUser.UserId.Value), ct));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCustomerRequest request, CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized();
        return OkOrError(await _mediator.Send(
            new UpdateCustomerCommand(_currentUser.UserId.Value, request.FirstName, request.LastName, request.Phone), ct));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => OkOrError(await _mediator.Send(new GetCustomerByIdQuery(id), ct));
}

public record UpdateCustomerRequest(string FirstName, string LastName, string? Phone);

using ECommerce.Application.Common.Interfaces;
using ECommerce.Application.DTOs;
using ECommerce.Application.Features.Orders.Commands;
using ECommerce.Application.Features.Orders.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[Route("api/[controller]")]
[Authorize]
public class OrdersController : ApiBaseController
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public OrdersController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var email = _currentUser.Role == "Admin" ? null : _currentUser.Email;
        return Ok(await _mediator.Send(new GetOrdersQuery(email), ct));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var isAdmin = _currentUser.Role == "Admin";
        return OkOrError(await _mediator.Send(new GetOrderByIdQuery(id, _currentUser.Email, isAdmin), ct));
    }

    [HttpPost]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("Orders")]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateOrderCommand(dto), ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id.ToString() }, result.Value)
            : OkOrError(result);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateOrderStatusRequest request, CancellationToken ct)
        => OkOrError(await _mediator.Send(new UpdateOrderStatusCommand(id, request.Status, request.TrackingId, request.Note), ct));

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(string id, [FromBody] CancelOrderRequest? request, CancellationToken ct)
    {
        if (!Guid.TryParse(id, out var orderId))
            return BadRequest("Invalid order ID");

        var isAdmin = _currentUser.Role == "Admin";
        return NoContentOrError(await _mediator.Send(new CancelOrderCommand(orderId, request?.Reason ?? "Customer requested cancellation", _currentUser.Email, isAdmin), ct));
    }
}

public record UpdateOrderStatusRequest(string Status, string? TrackingId, string? Note);
public record CancelOrderRequest(string Reason);

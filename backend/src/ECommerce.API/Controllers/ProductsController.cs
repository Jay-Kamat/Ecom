using ECommerce.Application.Features.Products.Commands;
using ECommerce.Application.Features.Products.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[Route("api/[controller]")]
public class ProductsController : ApiBaseController
{
    private readonly IMediator _mediator;
    public ProductsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] GetProductsQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
        => OkOrError(await _mediator.Send(new GetProductByIdQuery(id), ct));

    [HttpGet("{id:guid}/similar")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSimilar(Guid id, [FromQuery] int limit = 6, CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetSimilarProductsQuery(id, limit), ct));

    [HttpPost("search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search([FromBody] SemanticProductSearchQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id.ToString() }, result.Value)
            : OkOrError(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Application.DTOs.UpdateProductDto dto, CancellationToken ct)
        => OkOrError(await _mediator.Send(new UpdateProductCommand(id, dto), ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => NoContentOrError(await _mediator.Send(new DeleteProductCommand(id), ct));

    [HttpPost("images/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadImage(
        IFormFile file,
        [FromQuery] Guid? productId,
        [FromQuery] bool isPrimary = false,
        [FromQuery] string? altText = null,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Image.Empty", message = "No image file provided." });

        await using var stream = file.OpenReadStream();
        var command = new UploadProductImageCommand(
            FileStream: stream,
            FileName: file.FileName,
            ContentType: file.ContentType,
            ProductId: productId,
            IsPrimary: isPrimary,
            AltText: altText
        );

        var result = await _mediator.Send(command, ct);
        return OkOrError(result);
    }

    [HttpPost("{id:guid}/images")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadProductImage(
        Guid id,
        IFormFile file,
        [FromQuery] bool isPrimary = false,
        [FromQuery] string? altText = null,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Image.Empty", message = "No image file provided." });

        await using var stream = file.OpenReadStream();
        var command = new UploadProductImageCommand(
            FileStream: stream,
            FileName: file.FileName,
            ContentType: file.ContentType,
            ProductId: id,
            IsPrimary: isPrimary,
            AltText: altText
        );

        var result = await _mediator.Send(command, ct);
        return OkOrError(result);
    }

    [HttpPost("{id:guid}/reviews")]
    [Authorize]
    public async Task<IActionResult> AddReview(Guid id, [FromBody] Application.DTOs.ReviewDto review, CancellationToken ct)
        => OkOrError(await _mediator.Send(new AddProductReviewCommand(id, review), ct));
}

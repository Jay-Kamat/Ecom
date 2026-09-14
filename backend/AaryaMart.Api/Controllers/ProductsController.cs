using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AaryaMart.Application.Features.Products.Commands;
using AaryaMart.Application.Features.Products.Queries;
using AaryaMart.Domain.Entities;

namespace AaryaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ISender _mediator;

    public ProductsController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll(
        [FromQuery] string? category = null,
        [FromQuery] string? brand = null,
        [FromQuery] string? search = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool inStockOnly = false,
        [FromQuery] double? minRating = null,
        [FromQuery] string? sort = null)
    {
        var query = new GetProductsQuery(category, brand, search, maxPrice, inStockOnly, minRating, sort);
        var products = await _mediator.Send(query);
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetById(string id)
    {
        var product = await _mediator.Send(new GetProductByIdQuery(id));
        if (product == null)
            return NotFound(new { message = $"Product with ID '{id}' not found." });

        return Ok(product);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Product>> Create([FromBody] Product product)
    {
        if (string.IsNullOrWhiteSpace(product.Title))
            return BadRequest(new { message = "Product title is required." });

        var created = await _mediator.Send(new CreateProductCommand(product));
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] Product product)
    {
        var success = await _mediator.Send(new UpdateProductCommand(id, product));
        if (!success)
            return NotFound(new { message = $"Product with ID '{id}' not found." });

        return Ok(new { message = "Product updated successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await _mediator.Send(new DeleteProductCommand(id));
        if (!success)
            return NotFound(new { message = $"Product with ID '{id}' not found." });

        return Ok(new { message = "Product deleted successfully." });
    }

    public record AddReviewDto(string Title, string Text, int Rating = 5, string? Author = null);

    [HttpPost("{id}/reviews")]
    public async Task<ActionResult> AddReview(string id, [FromBody] AddReviewDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Text) || string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Review title and text are required." });

        var authorName = req.Author;
        if (string.IsNullOrWhiteSpace(authorName))
        {
            authorName = User.FindFirstValue(ClaimTypes.Name) ?? "Verified Buyer";
        }

        var review = new ProductReview
        {
            Author = authorName,
            Rating = Math.Clamp(req.Rating, 1, 5),
            Date = DateTime.UtcNow.ToString("dd MMM yyyy"),
            Title = req.Title.Trim(),
            Text = req.Text.Trim()
        };

        var (success, createdReview) = await _mediator.Send(new AddProductReviewCommand(id, review));
        if (!success)
            return NotFound(new { message = $"Product with ID '{id}' not found." });

        return Ok(new { message = "Review added successfully.", review = createdReview });
    }
}

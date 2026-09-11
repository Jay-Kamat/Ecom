using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMart.Api.Models;
using NovaMart.Api.Repositories;

namespace NovaMart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IDataStore _dataStore;

    public ProductsController(IDataStore dataStore)
    {
        _dataStore = dataStore;
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
        var products = await _dataStore.GetProductsAsync(
            category,
            brand,
            search,
            maxPrice,
            inStockOnly,
            minRating,
            sort
        );

        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetById(string id)
    {
        var product = await _dataStore.GetProductByIdAsync(id);
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

        if (string.IsNullOrWhiteSpace(product.Id))
            product.Id = "prod-" + Guid.NewGuid().ToString("N")[..8];

        if (product.Mrp == 0)
            product.Mrp = product.Price;

        var created = await _dataStore.CreateProductAsync(product);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] Product product)
    {
        product.Id = id;
        var updated = await _dataStore.UpdateProductAsync(product);
        if (!updated)
            return NotFound(new { message = $"Product with ID '{id}' not found." });

        return Ok(new { message = "Product updated successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var deleted = await _dataStore.DeleteProductAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Product with ID '{id}' not found." });

        return Ok(new { message = "Product deleted successfully." });
    }

    [HttpPost("{id}/reviews")]
    public async Task<ActionResult> AddReview(string id, [FromBody] AddReviewRequest req)
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

        var success = await _dataStore.AddProductReviewAsync(id, review);
        if (!success)
            return NotFound(new { message = $"Product with ID '{id}' not found." });

        return Ok(new { message = "Review added successfully.", review });
    }
}

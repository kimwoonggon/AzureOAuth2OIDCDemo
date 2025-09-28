using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AzureOAuthAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DataController : ControllerBase
{
    private readonly ILogger<DataController> _logger;

    // Sample data for demonstration
    private static readonly List<DataItem> _dataItems = new()
    {
        new DataItem { Id = 1, Title = "Azure AD Integration", Description = "Secure authentication with Azure AD", Category = "Security" },
        new DataItem { Id = 2, Title = "RESTful API Design", Description = "Best practices for API development", Category = "Development" },
        new DataItem { Id = 3, Title = "Cloud Architecture", Description = "Scalable cloud solutions with Azure", Category = "Architecture" },
        new DataItem { Id = 4, Title = "Microservices Pattern", Description = "Building distributed systems", Category = "Architecture" },
        new DataItem { Id = 5, Title = "DevOps Pipeline", Description = "CI/CD with Azure DevOps", Category = "DevOps" }
    };

    public DataController(ILogger<DataController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetAll([FromQuery] string? search = null)
    {
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? 
                       User.FindFirst("preferred_username")?.Value;
        
        _logger.LogInformation("Data requested by user {Email}", userEmail);

        var items = _dataItems.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            items = items.Where(d => 
                d.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                d.Description.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                d.Category.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(items);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var item = _dataItems.FirstOrDefault(d => d.Id == id);
        
        if (item == null)
        {
            return NotFound(new { message = "Data item not found" });
        }

        return Ok(item);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateDataItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Title is required" });
        }

        var newItem = new DataItem
        {
            Id = _dataItems.Max(d => d.Id) + 1,
            Title = request.Title,
            Description = request.Description ?? string.Empty,
            Category = request.Category ?? "General",
            CreatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown",
            CreatedAt = DateTime.UtcNow
        };

        _dataItems.Add(newItem);
        
        _logger.LogInformation("New data item created: {Title}", newItem.Title);

        return CreatedAtAction(nameof(GetById), new { id = newItem.Id }, newItem);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var item = _dataItems.FirstOrDefault(d => d.Id == id);
        
        if (item == null)
        {
            return NotFound(new { message = "Data item not found" });
        }

        _dataItems.Remove(item);
        
        _logger.LogInformation("Data item deleted: {Title}", item.Title);

        return NoContent();
    }
}

public class DataItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CreateDataItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
}
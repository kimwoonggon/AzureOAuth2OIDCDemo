using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AzureOAuthAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;

    public UserController(ILogger<UserController> logger)
    {
        _logger = logger;
    }

    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        // Get user information from Azure AD token claims
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? 
                   User.FindFirst("preferred_username")?.Value;
        var name = User.FindFirst(ClaimTypes.Name)?.Value ?? 
                  User.FindFirst("name")?.Value;
        
        _logger.LogInformation("Profile requested for user {Email}", email);

        return Ok(new
        {
            id = userId,
            email = email,
            name = name,
            authenticated = true,
            claims = User.Claims.Select(c => new { c.Type, c.Value })
        });
    }

    [HttpGet("validate")]
    public IActionResult ValidateToken()
    {
        // Simple endpoint to check if token is valid
        return Ok(new
        {
            authenticated = true,
            timestamp = DateTime.UtcNow
        });
    }
}
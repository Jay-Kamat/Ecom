namespace ECommerce.API.Middleware;

/// <summary>
/// Injects enterprise security response headers protecting against Clickjacking,
/// MIME sniffing, XSS, and unauthorized framing.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // HTTP Strict Transport Security (HSTS)
        headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

        // Clickjacking Defense
        headers.Append("X-Frame-Options", "DENY");

        // MIME-Type Sniffing Defense
        headers.Append("X-Content-Type-Options", "nosniff");

        // Referrer Information Protection
        headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

        // Restrict powerful browser capabilities
        headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

        // Cross-Origin Isolation & Embedding policies
        headers.Append("X-Permitted-Cross-Domain-Policies", "none");
        headers.Append("Cross-Origin-Opener-Policy", "same-origin");
        headers.Append("Cross-Origin-Resource-Policy", "same-origin");

        // Content Security Policy (CSP)
        headers.Append("Content-Security-Policy",
            "default-src 'self'; " +
            "img-src 'self' data: https: blob:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com data:; " +
            "connect-src 'self' https: wss:; " +
            "frame-ancestors 'none'; " +
            "object-src 'none'; " +
            "base-uri 'self';");

        await _next(context);
    }
}

public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}

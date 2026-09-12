using System.Net;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;

namespace ECommerce.Application.Common.Security;

/// <summary>
/// Enterprise security helper for XSS sanitization, SSRF URL verification, and injection defense.
/// </summary>
public static class SecuritySanitizer
{
    private static readonly Regex ScriptTagRegex = new(@"<script[^>]*>[\s\S]*?</script>", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex HtmlTagRegex = new(@"<[^>]+>", RegexOptions.Compiled);
    private static readonly Regex JavascriptUriRegex = new(@"javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex SqlWildcardRegex = new(@"[%_\[\]]", RegexOptions.Compiled);

    /// <summary>
    /// Sanitizes user-provided text by removing script tags and HTML-encoding special characters.
    /// </summary>
    public static string SanitizeText(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Strip explicit <script> blocks
        var cleaned = ScriptTagRegex.Replace(input, string.Empty);
        // Strip javascript: pseudo-protocol
        cleaned = JavascriptUriRegex.Replace(cleaned, string.Empty);
        // Strip other HTML tags if plain text is expected
        cleaned = HtmlTagRegex.Replace(cleaned, string.Empty);

        return HtmlEncoder.Default.Encode(cleaned.Trim());
    }

    /// <summary>
    /// Escapes wildcard characters (% and _) in user queries to prevent database wildcard DoS.
    /// </summary>
    public static string SanitizeSearchQuery(string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return string.Empty;

        // Truncate to reasonable length to avoid regex / CPU exhaustion
        var trimmed = query.Length > 100 ? query[..100] : query;
        return SqlWildcardRegex.Replace(trimmed, @"\$0");
    }

    /// <summary>
    /// SSRF protection: Validates that an external URL is HTTPS and does not point to
    /// localhost, link-local, or private RFC1918 internal networks.
    /// </summary>
    public static bool IsSafeExternalUrl(string? urlString)
    {
        if (string.IsNullOrWhiteSpace(urlString))
            return false;

        if (!Uri.TryCreate(urlString, UriKind.Absolute, out var uri))
            return false;

        // Only allow HTTP and HTTPS
        if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp)
            return false;

        var host = uri.DnsSafeHost.ToLowerInvariant();

        // Reject explicit loopback names
        if (host == "localhost" || host.EndsWith(".local") || host.EndsWith(".internal"))
            return false;

        // Check if host is an IP address
        if (IPAddress.TryParse(host, out var ip))
        {
            return IsPublicIp(ip);
        }

        try
        {
            // Resolve host IPs and check each
            var hostEntry = Dns.GetHostEntry(host);
            foreach (var resolvedIp in hostEntry.AddressList)
            {
                if (!IsPublicIp(resolvedIp))
                    return false;
            }
        }
        catch
        {
            // If DNS lookup fails, treat as unsafe
            return false;
        }

        return true;
    }

    private static bool IsPublicIp(IPAddress ip)
    {
        if (IPAddress.IsLoopback(ip))
            return false;

        var bytes = ip.GetAddressBytes();

        // IPv4 private ranges
        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            // 10.0.0.0/8
            if (bytes[0] == 10) return false;
            // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) return false;
            // 192.168.0.0/16
            if (bytes[0] == 192 && bytes[1] == 168) return false;
            // 169.254.0.0/16 (Link Local / Cloud Metadata endpoint 169.254.169.254)
            if (bytes[0] == 169 && bytes[1] == 254) return false;
            // 0.0.0.0
            if (bytes[0] == 0) return false;
        }

        // IPv6 private ranges (fe80:: link local, fc00:: unique local)
        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            if (ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal)
                return false;
        }

        return true;
    }
}

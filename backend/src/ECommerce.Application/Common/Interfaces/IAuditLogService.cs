namespace ECommerce.Application.Common.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(string action, string entityName, string entityId, string? oldValues = null, string? newValues = null, CancellationToken cancellationToken = default);
}

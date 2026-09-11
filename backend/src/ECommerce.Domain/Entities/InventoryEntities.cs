using ECommerce.Domain.Common;
using ECommerce.Domain.Enums;

namespace ECommerce.Domain.Entities;

public class Inventory : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int QuantityAvailable { get; set; }
    public int QuantityReserved { get; set; }
    public int LowStockThreshold { get; set; } = 5;

    public ICollection<InventoryTransaction> Transactions { get; set; } = new List<InventoryTransaction>();
}

public class InventoryTransaction : BaseEntity
{
    public Guid InventoryId { get; set; }
    public Inventory Inventory { get; set; } = null!;
    public InventoryTransactionType Type { get; set; }
    public int QuantityChange { get; set; }
    public string? ReferenceId { get; set; } // e.g. OrderId or PO#
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

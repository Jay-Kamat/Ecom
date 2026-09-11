namespace NovaMart.Domain.Entities;

public class SavedAddress
{
    public string Id { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Tag { get; set; } = "Home"; // Home, Work, Other
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;
}

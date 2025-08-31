namespace RPS.Server.Models;

public class Player
{
    public string Id { get; set; } = default!; // connection id
    public string DisplayName { get; set; } = "Guest";
    public int Score { get; set; } = 0;
    public bool IsCPU { get; set; } = false;
    public string? CurrentMove { get; set; }
    public bool ReadyForRematch { get; set; } = false;
}

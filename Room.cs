using System.Collections.Concurrent;

namespace RPS.Server.Models;

public class Room
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "Room";
    public int MaxPlayers { get; set; } = 2;
    public bool IsTournament { get; set; } = false;
    public ConcurrentDictionary<string, Player> Players { get; set; } = new();
    public List<(string SenderId, string Text, DateTime Time)> Chat { get; set; } = new();
    public int CurrentRound { get; set; } = 0;
}

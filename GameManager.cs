using RPS.Server.Models;
using System.Collections.Concurrent;

namespace RPS.Server.Services;

public class SubmitResult
{
    public bool RoundCompleted { get; set; }
    public object? ResultPayload { get; set; }
}

public class GameManager
{
    private readonly ConcurrentDictionary<string, Room> _rooms = new();
    private readonly ConcurrentDictionary<string, Player> _players = new();

    public IEnumerable<object> GetLobbySnapshot()
    {
        return _rooms.Values.Select(r => new { r.Id, r.Name, PlayerCount = r.Players.Count, r.MaxPlayers, r.IsTournament });
    }

    public Room CreateRoom(string ownerConnectionId, string name, int maxPlayers, bool isTournament)
    {
        var room = new Room { Name = name, MaxPlayers = Math.Max(2, maxPlayers), IsTournament = isTournament };
        var owner = new Player { Id = ownerConnectionId, DisplayName = "Host" };
        room.Players[owner.Id] = owner;
        _rooms[room.Id] = room;
        _players[owner.Id] = owner;
        return room;
    }

    public Room? GetRoom(string roomId) => _rooms.TryGetValue(roomId, out var r) ? r : null;

    public Player AddPlayerToRoom(string connectionId, string displayName, string roomId, bool asCPU = false)
    {
        var player = new Player { Id = connectionId, DisplayName = displayName, IsCPU = asCPU };
        _players[connectionId] = player;
        if (_rooms.TryGetValue(roomId, out var room))
        {
            room.Players[connectionId] = player;
            return player;
        }
        return player;
    }

    public void RemovePlayer(string connectionId, string roomId)
    {
        if (_rooms.TryGetValue(roomId, out var room))
        {
            room.Players.TryRemove(connectionId, out _);
        }
        _players.TryRemove(connectionId, out _);
    }

    public (string SenderId, string Text, DateTime Time) AddChatMessage(string roomId, string senderId, string message)
    {
        var chat = (senderId, message, DateTime.UtcNow);
        if (_rooms.TryGetValue(roomId, out var room))
        {
            room.Chat.Add(chat);
        }
        return chat;
    }

    private string DecideWinner(string a, string b)
    {
        if (a == b) return "draw";
        if ((a == "rock" && b == "scissor") || (a == "paper" && b == "rock") || (a == "scissor" && b == "paper"))
            return "a";
        return "b";
    }

    public SubmitResult SubmitMove(string roomId, string connectionId, string move)
    {
        if (!_rooms.TryGetValue(roomId, out var room))
            return new SubmitResult { RoundCompleted = false };

        if (!room.Players.TryGetValue(connectionId, out var player))
            return new SubmitResult { RoundCompleted = false };

        player.CurrentMove = move.ToLowerInvariant();

        // If all players have submitted, compute winner(s)
        var players = room.Players.Values.ToList();
        if (players.Any(p => string.IsNullOrEmpty(p.CurrentMove)))
            return new SubmitResult { RoundCompleted = false };

        // Simple multi-player resolution: pairwise elimination (first vs second -> winner vs third ...)
        var active = new List<Player>(players);
        while (active.Count > 1)
        {
            var p1 = active[0];
            var p2 = active[1];
            var move1 = p1.CurrentMove ?? "";
            var move2 = p2.CurrentMove ?? "";
            var res = DecideWinner(move1, move2);
            Player? winner = res == "a" ? p1 : res == "b" ? p2 : null;
            if (res == "draw")
            {
                // on draw, keep both and move on (naive)
                active.RemoveAt(0);
            }
            else if (winner != null)
            {
                active.RemoveAt(1);
                active.RemoveAt(0);
                active.Insert(0, winner);
            }
        }

        var winners = active.Select(p => p.Id).ToList();
        foreach (var p in room.Players.Values) p.CurrentMove = null;
        room.CurrentRound++;

        foreach (var w in winners)
        {
            if (room.Players.TryGetValue(w, out var pw)) pw.Score++;
        }

        var payload = new {
            Winners = winners,
            Round = room.CurrentRound,
            Scores = room.Players.Values.Select(x => new { x.DisplayName, x.Score })
        };

        return new SubmitResult { RoundCompleted = true, ResultPayload = payload };
    }

    public bool RequestRematch(string roomId, string connectionId)
    {
        if (!_rooms.TryGetValue(roomId, out var room)) return false;
        if (!room.Players.TryGetValue(connectionId, out var player)) return false;
        player.ReadyForRematch = true;
        if (room.Players.Values.All(p => p.ReadyForRematch))
            return true;
        return false;
    }

    public void ResetRound(string roomId)
    {
        if (!_rooms.TryGetValue(roomId, out var room)) return;
        foreach (var p in room.Players.Values)
        {
            p.ReadyForRematch = false;
            p.CurrentMove = null;
            p.Score = 0;
        }
        room.CurrentRound = 0;
    }

    public object GetRoomScoreboard(string roomId)
    {
        if (!_rooms.TryGetValue(roomId, out var room)) return new { };
        return room.Players.Values.Select(x => new { x.DisplayName, x.Score });
    }
}

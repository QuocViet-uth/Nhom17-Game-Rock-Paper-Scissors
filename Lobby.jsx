import React, { useState } from 'react';

export default function Lobby({ conn, lobby }){
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);

  const create = async () => {
    await conn.invoke('CreateRoom', roomName || 'Room', Number(maxPlayers || 2), false);
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Lobby</h2>
      <div className="space-y-2">
        {lobby.map(r => (
          <div key={r.id} className="p-2 border rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-gray-500">{r.playerCount}/{r.maxPlayers} players</div>
            </div>
            <button className="btn" onClick={() => conn.invoke('JoinRoom', r.id, 'Player_'+Math.floor(Math.random()*1000), false)}>Join</button>
          </div>
        ))}
      </div>

      <hr className="my-3" />

      <div>
        <input className="w-full p-2 border rounded mb-2" placeholder="Room name" value={roomName} onChange={e=>setRoomName(e.target.value)} />
        <input type="number" className="w-full p-2 border rounded mb-2" value={maxPlayers} onChange={e=>setMaxPlayers(e.target.value)} />
        <button className="w-full p-2 bg-blue-600 text-white rounded" onClick={create}>Create Room</button>
      </div>
    </div>
  );
}

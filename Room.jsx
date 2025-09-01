import React, { useState } from 'react';

export default function Room({ conn, room }){
  const [chat, setChat] = useState('');
  if (!room) return <div className="bg-white p-4 rounded shadow">No room selected</div>;

  const submitMove = async (m) => {
    await conn.invoke('SubmitMove', room.id, m);
  };

  const sendChat = async () => {
    if (!chat) return;
    await conn.invoke('SendChat', room.id, chat);
    setChat('');
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-2xl font-semibold mb-2">{room.name} — {Object.keys(room.players || {}).length}/{room.maxPlayers}</h2>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="mb-2 font-medium">Players</div>
          <div className="space-y-2">
            {Object.values(room.players || {}).map(p => (
              <div key={p.id} className="p-2 border rounded flex justify-between">
                <div>{p.displayName}{p.isCPU ? ' (CPU)' : ''}</div>
                <div>Score: {p.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/3">
          <div className="mb-2 font-medium">Controls</div>
          <div className="space-x-2">
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>submitMove('rock')}>Rock</button>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>submitMove('paper')}>Paper</button>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>submitMove('scissor')}>Scissor</button>
          </div>

          <div className="mt-4">
            <input className="w-full p-2 border rounded" placeholder="Chat message" value={chat} onChange={e=>setChat(e.target.value)} />
            <button className="w-full mt-2 p-2 bg-blue-600 text-white rounded" onClick={sendChat}>Send</button>
          </div>
        </div>
      </div>

    </div>
  );
}

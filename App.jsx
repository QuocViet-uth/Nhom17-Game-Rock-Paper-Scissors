import React, { useEffect, useState } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import Lobby from './components/Lobby';
import Room from './components/Room';

export default function App(){
  const [conn, setConn] = useState(null);
  const [lobby, setLobby] = useState([]);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const c = new HubConnectionBuilder()
      .withUrl('http://localhost:5000/gamehub')
      .withAutomaticReconnect()
      .build();
    c.start().then(() => {
      console.log('connected');
    });

    c.on('LobbyUpdate', (data) => setLobby(data));
    c.on('RoomUpdate', (r) => setRoom(r));
    c.on('ChatMessage', (m) => {
      // room chat updates currently come via RoomUpdate
      console.log('chat', m);
    });
    setConn(c);
    return () => { c.stop(); }
  }, []);

  if (!conn) return <div className="p-4">Connecting...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Rock Paper Scissors - Multiplayer</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Lobby conn={conn} lobby={lobby} />
          </div>
          <div className="col-span-2">
            <Room conn={conn} room={room} />
          </div>
        </div>
      </div>
    </div>
  );
}

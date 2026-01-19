"use client";
import { useState } from 'react';
import { useGame } from '@/context/GameContext';

export default function Home() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const { socket } = useGame();

  const handleCreate = () => {
    if (!name.trim()) return alert("Enter codename");
    socket.emit("createRoom", { playerName: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return alert("Credentials required");
    socket.emit("joinRoom", { 
      roomCode: roomCode.trim().toUpperCase(), 
      playerName: name.trim() 
    });
  };

  return (
    <main className="flex flex-col justify-center items-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md space-y-8 bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-black text-indigo-500 italic">SHADOW<span className="text-white">SIGNAL</span></h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">Infiltrator Protocol v1.0</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Identity Codename"
            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700 outline-none focus:border-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={handleCreate} className="w-full bg-indigo-600 p-4 rounded-2xl font-black hover:bg-indigo-500 transition-all">
            CREATE NEW MISSION
          </button>
          
          <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-2 text-slate-500">Or Intercept</span></div></div>

          <input
            type="text"
            placeholder="Room Code"
            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700 outline-none text-center font-mono uppercase"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={handleJoin} className="w-full bg-slate-700 p-4 rounded-2xl font-bold hover:bg-slate-600 transition-all">
            JOIN MISSION
          </button>
        </div>
      </div>
    </main>
  );
}
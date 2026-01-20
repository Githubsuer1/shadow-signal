"use client";
import { useGame } from '@/context/GameContext';
import { useState } from 'react';

export default function SpeakingGrid() {
  const { gameState, socket } = useGame();
  const [clueInput, setClueInput] = useState("");

  const isMyTurn = gameState.activePlayerId === socket?.id;

  // 🆕 Handles submitting the text clue to the backend
  const handleSubmitClue = () => {
    if (!clueInput.trim()) return;
    socket.emit("submitClue", { clue: clueInput.trim() });
    setClueInput(""); // Clear local input
  };

  return (
    <div className="p-6 max-w-2xl mx-auto pt-16 pb-48">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-widest text-white uppercase">Speaking Phase</h2>
        <p className="text-slate-500 text-xs mt-1">Provide a clue without revealing too much</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {gameState.players.map((player) => {
          const isActive = player.socketId === gameState.activePlayerId;
          const isMe = player.socketId === socket?.id;
          
          return (
            <div 
              key={player.socketId}
              className={`relative p-6 rounded-3xl border-2 transition-all duration-500 ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-400 scale-105 shadow-[0_0_30px_rgba(99,102,241,0.4)] z-10' 
                  : 'bg-slate-800 border-slate-700 opacity-60'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black mb-2 ${
                  isActive ? 'bg-indigo-500' : 'bg-slate-900'
                }`}>
                  {player.name[0].toUpperCase()}
                </div>
                <p className="font-bold text-sm truncate w-full text-center">
                  {player.name} {isMe && " (You)"}
                </p>
                
                {/* 🆕 CLUE BUBBLE: Displays the submitted clue */}
                <div className="mt-3 w-full min-h-[40px] bg-black/20 rounded-xl flex items-center justify-center px-2 py-1">
                   {player.clue ? (
                     <span className="text-white font-black text-xs uppercase italic tracking-tighter italic">
                       "{player.clue}"
                     </span>
                   ) : (
                     <span className="text-slate-500 text-[10px] animate-pulse">
                       {isActive ? "THINKING..." : "WAITING"}
                     </span>
                   )}
                </div>

                {isActive && (
                  <div className="mt-2 text-xl font-black font-mono text-indigo-200">
                    {gameState.timeLeft}s
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🆕 CLUE INPUT: Only visible to the active player */}
      {isMyTurn && (
        <div className="fixed bottom-10 left-0 right-0 px-6 flex justify-center animate-in slide-in-from-bottom-5">
          <div className="bg-slate-900 p-2 rounded-2xl border border-indigo-500 shadow-2xl flex w-full max-w-md gap-2">
            <input 
              autoFocus
              className="flex-1 bg-transparent px-4 py-2 text-white outline-none"
              placeholder="Type your clue..."
              value={clueInput}
              onChange={(e) => setClueInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitClue()}
            />
            <button 
              onClick={handleSubmitClue}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black hover:bg-indigo-500 transition-colors"
            >
              SEND
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
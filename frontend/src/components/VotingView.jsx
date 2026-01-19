"use client";
import { useGame } from '@/context/GameContext';
import { useState } from 'react';

export default function VotingView() {
  const { gameState, socket } = useGame();
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (targetId) => {
    if (hasVoted) return;
    socket.emit("castVote", { targetId });
    setHasVoted(true);
  };

  // We don't want to vote for ourselves or dead players
  const candidates = gameState.players.filter(p => p.socketId !== socket?.id);

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-red-500 uppercase italic">Identify the Threat</h1>
        <p className="text-slate-400 mt-2">Cast your vote to eliminate the outsider.</p>
      </div>

      <div className="w-full space-y-4">
        {candidates.map((player) => (
          <button
            key={player.socketId}
            onClick={() => handleVote(player.socketId)}
            disabled={hasVoted}
            className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
              hasVoted 
                ? 'bg-slate-800 border-slate-700 opacity-50 grayscale' 
                : 'bg-slate-800 border-slate-700 hover:border-red-500 hover:bg-slate-700 active:scale-95'
            }`}
          >
            <span className="text-xl font-bold">{player.name}</span>
            <div className="w-8 h-8 rounded-full border border-slate-500 flex items-center justify-center text-xs">
               VOTE
            </div>
          </button>
        ))}
      </div>

      {hasVoted && (
        <div className="mt-10 p-4 bg-indigo-600/20 border border-indigo-500/50 rounded-xl animate-pulse">
          <p className="text-indigo-400 font-bold text-center">
            Signal Transmitted. Awaiting others...
          </p>
        </div>
      )}
    </div>
  );
}
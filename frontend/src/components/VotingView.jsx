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

  // Only vote for other living players
  const candidates = gameState.players.filter(p => p.socketId !== socket?.id && p.isAlive);

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-red-500 uppercase italic">Cast Your Vote</h1>
        <p className="text-slate-400 mt-2">Analyze the clues. Who is the outsider?</p>
      </div>

      <div className="w-full space-y-3">
        {candidates.map((player) => (
          <button
            key={player.socketId}
            onClick={() => handleVote(player.socketId)}
            disabled={hasVoted}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              hasVoted 
                ? 'bg-slate-800/50 border-slate-700 opacity-50' 
                : 'bg-slate-800 border-slate-700 hover:border-red-500 hover:scale-[1.02]'
            }`}
          >
            <div className="flex justify-between items-center">
                <div>
                    <span className="block text-sm text-slate-500 font-bold uppercase tracking-widest">Suspect</span>
                    <span className="text-xl font-black text-white">{player.name}</span>
                </div>
                {/* 🆕 CLUE PREVIEW: Shows the player's clue as evidence during voting */}
                <div className="bg-black/30 px-3 py-1 rounded-lg border border-white/5">
                    <span className="text-xs text-indigo-400 font-mono italic">"{player.clue || 'No clue'}"</span>
                </div>
            </div>
          </button>
        ))}
      </div>

      {hasVoted && (
        <div className="mt-8 text-center p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
          <p className="text-indigo-400 font-black animate-pulse">VOTE RECORDED. AWAITING RESULTS...</p>
        </div>
      )}
    </div>
  );
}
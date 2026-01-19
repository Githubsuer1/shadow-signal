"use client";
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';

export default function GameOverView() {
  const { gameState } = useGame();
  const router = useRouter();

  // Winner can be "CITIZENS", "AGENTS", "SPY", or "INFILTRATOR"
  const isShadowWin = gameState.winner === 'INFILTRATOR' || gameState.winner === 'SPY';

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className={`text-6xl font-black italic ${isShadowWin ? 'text-red-500' : 'text-green-400'}`}>
          {isShadowWin ? 'FAILURE' : 'SUCCESS'}
        </h1>
        <p className="text-slate-400 font-bold uppercase mt-2">
          {gameState.winner} HAS WON THE MATCH
        </p>
      </div>

      <div className="w-full bg-slate-800 rounded-3xl border border-slate-700 p-6 shadow-2xl">
        <p className="text-center text-xs text-slate-500 uppercase font-black mb-4">Final Intelligence Report</p>
        <div className="space-y-4">
          {gameState.players.map((p) => (
            <div key={p.socketId} className="flex justify-between items-center border-b border-slate-700/50 pb-2">
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-[10px] text-indigo-400">{p.role}</p>
              </div>
              <p className="text-sm italic text-slate-400">{p.word || '???'}</p>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => window.location.href = '/'} 
        className="mt-10 w-full bg-white text-slate-900 py-4 rounded-2xl font-black"
      >
        NEW MISSION
      </button>
    </div>
  );
}
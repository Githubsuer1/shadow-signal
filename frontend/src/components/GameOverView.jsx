"use client";
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';

export default function GameOverView() {
  const { gameState } = useGame();
  const router = useRouter();

  // Winner categories
  const isShadowWin = gameState.winner === 'INFILTRATOR' || gameState.winner === 'SPY';

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
      
      {/* 🏆 Result Header */}
      <div className="text-center mb-8">
        <h1 className={`text-6xl font-black italic tracking-tighter ${isShadowWin ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]'}`}>
          {isShadowWin ? 'FAILURE' : 'SUCCESS'}
        </h1>
        <div className="mt-2 flex flex-col items-center">
          <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">
            Mission Concluded
          </p>
          <p className={`text-sm font-black mt-1 px-4 py-1 rounded-full ${isShadowWin ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
             {gameState.winner} DOMINATION
          </p>
        </div>
      </div>

      {/* 📊 Final Intelligence Report */}
      <div className="w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
        <h3 className="text-center text-[10px] text-slate-500 uppercase font-black mb-6 tracking-widest border-b border-white/5 pb-4">
          Declassified Player Data
        </h3>
        
        <div className="space-y-4">
          {gameState.players.map((p) => (
            <div key={p.socketId} className="flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${p.role === 'SPY' || p.role === 'INFILTRATOR' ? 'bg-red-500/20 text-red-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  {p.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-200 leading-none">{p.name}</p>
                  <p className={`text-[9px] uppercase font-black mt-1 ${p.role === 'SPY' || p.role === 'INFILTRATOR' ? 'text-red-500' : 'text-indigo-400'}`}>
                    {p.role}
                  </p>
                </div>
              </div>

              {/* 🆕 Fix: Handling the '???' by checking if word exists in the final state */}
              <div className="text-right">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-tighter">Secret Word</p>
                <p className={`text-sm font-black italic ${p.role === 'SPY' || p.role === 'INFILTRATOR' ? 'text-red-400' : 'text-green-400'}`}>
                   {/* If backend cleared words, show a fallback, else show the word */}
                   {p.word ? p.word : "UNKNOWN"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔄 Action Button */}
      <button 
        onClick={() => window.location.href = '/'} 
        className="mt-10 w-full bg-white text-slate-900 py-4 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
      >
        RETURN TO BASE
      </button>
    </div>
  );
}
import { useGame } from "@/hooks/useGame";

export default function RoleReveal() {
  const { gameState } = useGame();
  
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-500">
      <h2 className="text-indigo-400 font-mono tracking-[0.3em] mb-2 animate-pulse">TRANSMISSION RECEIVED</h2>
      <div className="text-center p-8 border-2 border-indigo-500 rounded-3xl bg-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
        <p className="text-sm text-slate-400 uppercase font-bold mb-1">Your Identity</p>
        <h1 className={`text-5xl font-black mb-6 ${gameState.myRole === 'AGENT' ? 'text-green-400' : 'text-red-500'}`}>
          {gameState.myRole}
        </h1>
        
        <div className="h-px bg-slate-700 w-full mb-6"></div>
        
        <p className="text-sm text-slate-400 uppercase font-bold mb-1">Your Secret Word</p>
        <h2 className="text-4xl font-black tracking-tighter italic">
          {gameState.myRole === 'INFILTRATOR' ? "UNKNOWN" : gameState.myWord}
        </h2>
      </div>
      <p className="mt-8 text-slate-500 text-xs animate-bounce">Starting in 5s...</p>
    </div>
  );
}
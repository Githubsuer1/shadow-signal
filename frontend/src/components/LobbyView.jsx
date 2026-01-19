"use client";
import { useGame } from '@/context/GameContext';
import { useParams } from 'next/navigation';

export default function LobbyView() {
  const { gameState, socket } = useGame();
  const { code } = useParams();

  const me = gameState.players.find(p => p.socketId === socket?.id);
  const isHost = me?.isHost;

  const handleStartGame = () => {
    if (gameState.players.length < 3) {
      alert("Need at least 3 players!");
      return;
    }
    socket.emit("startGame");
  };

  const handleModeChange = (mode) => {
    socket.emit("setGameMode", { gameMode: mode });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-md mt-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-indigo-400 font-mono font-bold tracking-widest text-sm uppercase">Room Code</p>
          <h1 className="text-6xl font-black tracking-tighter">{code}</h1>
        </div>

        {/* Host Settings */}
        {isHost && (
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl mb-8 shadow-xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Select Protocol</h3>
            <div className="flex gap-3">
              {['INFILTRATOR', 'SPY'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    gameState.gameMode === mode 
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' 
                    : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="space-y-3 mb-24">
          <h3 className="text-slate-500 font-bold text-xs uppercase px-1">Active Signals ({gameState.players.length})</h3>
          {gameState.players.map((p) => (
            <div key={p.socketId} className="flex justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <span className="font-semibold">{p.name} {p.socketId === socket?.id && "(You)"}</span>
              {p.isHost && <span className="text-[10px] text-amber-500 font-black">HOST</span>}
            </div>
          ))}
        </div>

        {/* Start Button Fixed Footer */}
        <div className="fixed bottom-10 left-0 right-0 px-6 max-w-md mx-auto">
          {isHost ? (
            <button onClick={handleStartGame} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-lg shadow-xl">
              INITIALIZE GAME
            </button>
          ) : (
            <div className="text-center p-4 bg-slate-800/30 rounded-2xl text-slate-500 animate-pulse border border-slate-800">
              Waiting for host...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
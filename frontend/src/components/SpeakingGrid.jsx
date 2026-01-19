"use client";
import { useGame } from '@/context/GameContext';

export default function SpeakingGrid() {
  const { gameState, socket } = useGame();

  const handleNextTurn = () => {
    socket.emit("nextTurn");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto pt-16 pb-32">
      {/* 1. Header showing Phase Information */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-widest text-white uppercase">
          Speaking Phase
        </h2>
        <p className="text-slate-500 text-xs mt-1">Listen carefully to identify the Infiltrator</p>
      </div>

      {/* 2. The Players Grid */}
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
                  : 'bg-slate-800 border-slate-700 opacity-40'
              }`}
            >
              {/* Active Speaker Indicator */}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-indigo-600 text-[10px] font-black px-4 py-1 rounded-full shadow-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                  CURRENTLY SPEAKING
                </div>
              )}

              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mb-3 ${
                  isActive ? 'bg-indigo-500' : 'bg-slate-900'
                }`}>
                  {player.name[0].toUpperCase()}
                </div>
                <p className="font-bold text-lg truncate w-full text-center">
                  {player.name} {isMe && " (You)"}
                </p>
                
                {/* The Timer (Only shows on active player) */}
                {isActive && (
                  <div className="mt-2 text-3xl font-black font-mono">
                    00:{gameState.timeLeft < 10 ? `0${gameState.timeLeft}` : gameState.timeLeft}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Action Button (Only for the active player) */}
      {gameState.activePlayerId === socket?.id && (
        <div className="fixed bottom-32 left-0 right-0 px-6 flex justify-center">
          <button 
            onClick={handleNextTurn}
            className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black shadow-2xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            I'M DONE SPEAKING
          </button>
        </div>
      )}
    </div>
  );
}
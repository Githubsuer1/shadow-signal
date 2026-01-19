"use client";
import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import LobbyView from '@/components/LobbyView';
import SpeakingGrid from '@/components/SpeakingGrid';
import RoleReveal from '@/components/RoleReveal';
import VotingView from '@/components/VotingView';
import GameOverView from '@/components/GameOverView';

export default function LobbyPage() {
  const { gameState } = useGame();
  const [showRole, setShowRole] = useState(false);

  useEffect(() => {
    // Show role reveal only when game just starts
    if (gameState.status === 'PLAYING') {
      setShowRole(true);
      const timer = setTimeout(() => setShowRole(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.status]);

  if (gameState.status === 'LOBBY') return <LobbyView />;

  return (
    <main className="min-h-screen bg-slate-900 text-white relative">
      {showRole && <RoleReveal />}
      
      {gameState.status === 'PLAYING' && <SpeakingGrid />}
      {gameState.status === 'VOTING' && <VotingView />}
      {gameState.status === 'FINISHED' && <GameOverView />}

      {/* HUD Elements */}
      {gameState.status !== 'FINISHED' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-indigo-500/30 p-4 rounded-2xl shadow-2xl text-center z-10">
          <p className="text-[10px] text-indigo-400 font-black uppercase mb-1">Secret Word</p>
          <p className="text-xl font-black uppercase tracking-tighter">
            {gameState.myRole === 'INFILTRATOR' ? '???' : gameState.myWord}
          </p>
        </div>
      )}
    </main>
  );
}
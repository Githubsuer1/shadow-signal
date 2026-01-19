// hooks/useGame.js
'use client';

import { useEffect, useState, useCallback } from 'react';

export function useGame(socket) {
  const [gameState, setGameState] = useState('home'); // home, lobby, game, results
  const [room, setRoom] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [myRole, setMyRole] = useState(null);
  const [myWord, setMyWord] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState('');
  const [gameResult, setGameResult] = useState(null);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Player joined room
    socket.on('player-joined', ({ player, players }) => {
      console.log('👤 Player joined:', player.name);
      setRoom(prev => ({ ...prev, players }));
    });

    // Player left room
    socket.on('player-left', ({ playerId, players, newHostId }) => {
      console.log('👋 Player left:', playerId);
      setRoom(prev => ({
        ...prev,
        players,
        hostId: newHostId
      }));
    });

    // Game mode changed
    socket.on('game-mode-changed', (gameMode) => {
      console.log('🎮 Game mode changed:', gameMode);
      setRoom(prev => ({ ...prev, gameMode }));
    });

    // Game started - receive private role and word
    socket.on('game-started', ({ role, word, gameMode }) => {
      console.log('🎮 Game started! Role:', role, 'Word:', word);
      setMyRole(role);
      setMyWord(word);
      setGameState('game');
    });

    // Game state update
    socket.on('game-state-update', (update) => {
      console.log('🔄 Game state update:', update);
      setRoom(prev => ({ ...prev, ...update }));
    });

    // Turn changed
    socket.on('turn-changed', ({ currentTurn }) => {
      console.log('⏭️ Turn changed to:', currentTurn);
      setRoom(prev => ({ ...prev, currentTurn }));
      setTimeLeft(30);
    });

    // Phase changed
    socket.on('phase-changed', ({ phase }) => {
      console.log('📍 Phase changed to:', phase);
      setRoom(prev => ({ ...prev, phase }));
      setTimeLeft(30);
    });

    // Timer update
    socket.on('timer-update', ({ timeLeft: newTime }) => {
      setTimeLeft(newTime);
    });

    // Vote cast
    socket.on('vote-cast', ({ voteCount, totalPlayers }) => {
      console.log(`🗳️ Votes: ${voteCount}/${totalPlayers}`);
    });

    // Player eliminated
    socket.on('player-eliminated', ({ eliminatedPlayer, players }) => {
      console.log('❌ Player eliminated:', eliminatedPlayer.name);
      setRoom(prev => ({
        ...prev,
        players,
        eliminated: [...(prev.eliminated || []), eliminatedPlayer.id],
        phase: 'speaking',
        currentTurn: 0
      }));
      setTimeLeft(30);
    });

    // Game ended
    socket.on('game-ended', ({ winner, eliminatedPlayer, allPlayers, reason }) => {
      console.log('🏁 Game ended! Winner:', winner);
      setGameResult({ winner, eliminatedPlayer, allPlayers, reason });
      setGameState('results');
    });

    // Auto next turn
    socket.on('auto-next-turn', ({ roomCode }) => {
      console.log('⏩ Auto advancing turn');
      socket.emit('next-turn', { roomCode });
    });

    // Auto tally votes
    socket.on('auto-tally-votes', ({ roomCode }) => {
      console.log('🗳️ Auto tallying votes');
      socket.emit('tally-votes', { roomCode });
    });

    // Error
    socket.on('error', ({ message }) => {
      console.error('❌ Server error:', message);
      setError(message);
    });

    // Cleanup
    return () => {
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-mode-changed');
      socket.off('game-started');
      socket.off('game-state-update');
      socket.off('turn-changed');
      socket.off('phase-changed');
      socket.off('timer-update');
      socket.off('vote-cast');
      socket.off('player-eliminated');
      socket.off('game-ended');
      socket.off('auto-next-turn');
      socket.off('auto-tally-votes');
      socket.off('error');
    };
  }, [socket]);

  // Game actions
  const createRoom = useCallback((playerName) => {
    if (!socket || !playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    console.log('🎯 Creating room for:', playerName);
    socket.emit('create-room', { playerName }, (response) => {
      if (response.success) {
        console.log('✅ Room created:', response.roomCode);
        setRoomCode(response.roomCode);
        setRoom(response.room);
        setGameState('lobby');
        setError('');
      } else {
        setError(response.error || 'Failed to create room');
      }
    });
  }, [socket]);

  const joinRoom = useCallback((playerName, code) => {
    if (!socket || !playerName.trim() || !code.trim()) {
      setError('Please enter your name and room code');
      return;
    }

    console.log('🎯 Joining room:', code);
    socket.emit('join-room', { 
      roomCode: code.toUpperCase(), 
      playerName 
    }, (response) => {
      if (response.success) {
        console.log('✅ Joined room:', code);
        setRoomCode(code.toUpperCase());
        setRoom(response.room);
        setGameState('lobby');
        setError('');
      } else {
        setError(response.error || 'Failed to join room');
      }
    });
  }, [socket]);

  const changeGameMode = useCallback((mode) => {
    if (!socket || !roomCode) return;
    console.log('🎮 Changing game mode to:', mode);
    socket.emit('change-game-mode', { roomCode, gameMode: mode });
  }, [socket, roomCode]);

  const startGame = useCallback(() => {
    if (!socket || !roomCode) return;
    console.log('🚀 Starting game...');
    socket.emit('start-game', { roomCode });
  }, [socket, roomCode]);

  const nextTurn = useCallback(() => {
    if (!socket || !roomCode) return;
    console.log('⏭️ Next turn');
    socket.emit('next-turn', { roomCode });
  }, [socket, roomCode]);

  const castVote = useCallback((playerId) => {
    if (!socket || !roomCode) return;
    console.log('🗳️ Voting for:', playerId);
    socket.emit('cast-vote', { roomCode, votedPlayerId: playerId });
  }, [socket, roomCode]);

  const tallyVotes = useCallback(() => {
    if (!socket || !roomCode) return;
    console.log('📊 Tallying votes');
    socket.emit('tally-votes', { roomCode });
  }, [socket, roomCode]);

  const leaveRoom = useCallback(() => {
    if (!socket || !roomCode) return;
    console.log('👋 Leaving room');
    socket.emit('leave-room', { roomCode });
    setGameState('home');
    setRoom(null);
    setRoomCode('');
    setMyRole(null);
    setMyWord(null);
    setError('');
    setGameResult(null);
  }, [socket, roomCode]);

  const playAgain = useCallback(() => {
    setGameState('lobby');
    setMyRole(null);
    setMyWord(null);
    setGameResult(null);
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    // State
    gameState,
    room,
    roomCode,
    myRole,
    myWord,
    timeLeft,
    error,
    gameResult,
    
    // Actions
    createRoom,
    joinRoom,
    changeGameMode,
    startGame,
    nextTurn,
    castVote,
    tallyVotes,
    leaveRoom,
    playAgain,
    clearError,
    
    // Computed
    isHost: room && socket && room.hostId === socket.id,
    alivePlayers: room?.players?.filter(p => p.isAlive) || [],
    currentPlayer: room?.players?.filter(p => p.isAlive)[room?.currentTurn || 0]
  };
}
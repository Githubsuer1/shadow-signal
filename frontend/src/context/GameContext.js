"use client";
import { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const router = useRouter();
    const [gameState, setGameState] = useState({
        roomCode: '',
        players: [],
        myRole: '',
        myWord: '',
        status: 'LOBBY',
        activePlayerId: '',
        timeLeft: 30,
        gameMode: 'INFILTRATOR',
        winner: null,
        eliminatedPlayer: null
    });

    useEffect(() => {
        const URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const newSocket = io(URL, { transports: ['websocket'] });
        setSocket(newSocket);

        // --- Room Management ---
        newSocket.on("roomCreated", (data) => {
            setGameState(prev => ({ ...prev, roomCode: data.roomCode, players: data.players }));
            router.push(`/lobby/${data.roomCode}`);
        });

        newSocket.on("joinSuccess", (data) => {
            setGameState(prev => ({ ...prev, roomCode: data.roomCode, players: data.players, gameMode: data.gameMode }));
            router.push(`/lobby/${data.roomCode}`);
        });

        newSocket.on("roomUpdate", (data) => {
            setGameState(prev => ({ ...prev, players: data.players }));
        });

        // --- Game Logic ---
        newSocket.on("gameStarted", (data) => {
            setGameState(prev => ({
                ...prev,
                myRole: data.role,
                myWord: data.word,
                players: data.players,
                status: 'PLAYING',
                winner: null
            }));
        });

        newSocket.on("timerTick", ({ timeLeft }) => {
            setGameState(prev => ({ ...prev, timeLeft }));
        });

        newSocket.on("turnChange", (data) => {
            setGameState(prev => ({ ...prev, activePlayerId: data.activePlayerId, timeLeft: data.timeLeft }));
        });

        // Listen for real-time clue updates from any player
        newSocket.on("clueUpdated", ({ socketId, clue }) => {
            setGameState(prev => ({
                ...prev,
                players: prev.players.map(p =>
                    p.socketId === socketId ? { ...p, clue } : p
                )
            }));
        });

        // When a round ends, the backend sends updated player list (clues cleared)
        newSocket.on("roundResult", (data) => {
            setGameState(prev => ({
                ...prev,
                players: data.players,
                status: 'PLAYING' // Backend transitions back to playing
            }));
        });

        // Ensure phase changes (like moving to voting) sync the latest player data
        newSocket.on("phaseChange", (data) => {
            setGameState(prev => ({
                ...prev,
                status: data.status,
                players: data.players || prev.players // Sync final clues for voting
            }));
        });

        newSocket.on("gameOver", (data) => {
            setGameState(prev => ({
                ...prev,
                status: 'FINISHED',
                winner: data.winner,
                eliminatedPlayer: data.eliminated
            }));
        });

        return () => newSocket.close();
    }, [router]);

    return (
        <GameContext.Provider value={{ socket, gameState, setGameState }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
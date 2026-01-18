import Room from "../models/Room.model.js";
import wordsData from "../data/wordsData.json" with { type: "json" };
import { getSpyWord } from '../services/ai.services.js';

export const activeTimers = {};

// Helper to kill timers immediately
const stopRoomTimer = (roomCode) => {
    if (activeTimers[roomCode]) {
        clearInterval(activeTimers[roomCode]);
        delete activeTimers[roomCode];
    }
};

export const setupGameHandlers = (io, socket) => {
    
    socket.on("startGame", async () => {
        try {
            const { roomCode } = socket.data;
            const room = await Room.findOne({ code: roomCode });

            if (!room || room.hostId !== socket.id) return;
            if (room.players.length < 3) return socket.emit("error", "Min 3 players required");

            const domain = wordsData.domains[Math.floor(Math.random() * wordsData.domains.length)];
            const baseObj = domain.words[Math.floor(Math.random() * domain.words.length)];
            let specialWord = room.gameMode === 'SPY' 
                ? (await getSpyWord(baseObj.word, domain.name) || baseObj.similar[0])
                : null;

            const shadowIdx = Math.floor(Math.random() * room.players.length);
            room.players.forEach((p, i) => {
                const isShadow = i === shadowIdx;
                p.role = isShadow ? (room.gameMode === 'SPY' ? 'SPY' : 'INFILTRATOR') : (room.gameMode === 'SPY' ? 'AGENT' : 'CITIZEN');
                p.word = isShadow ? specialWord : baseObj.word;
                p.isAlive = true;
                p.votesReceived = 0;
                p.votedFor = null;
            });

            room.status = "PLAYING";
            room.currentTurnIndex = 0; 
            await room.save();

            room.players.forEach((p) => {
                io.to(p.socketId).emit("gameStarted", {
                    status: "PLAYING",
                    role: p.role,
                    word: p.word,
                    players: room.players.map(pl => ({ name: pl.name, socketId: pl.socketId, isAlive: pl.isAlive })),
                    activePlayerId: room.players[0].socketId
                });
            });

            startTurn(io, roomCode);
        } catch (error) {
            console.error(error);
            socket.emit("error", "Failed to start mission");
        }
    });

    socket.on("nextTurn", () => handleNextTurn(io, socket.data.roomCode));

    socket.on("castVote", async ({ targetId }) => {
        try {
            const { roomCode } = socket.data;
            const room = await Room.findOne({ code: roomCode });
            if (!room || room.status !== 'VOTING') return;

            const voter = room.players.find(p => p.socketId === socket.id);
            const target = room.players.find(p => p.socketId === targetId);

            if (!voter?.isAlive || voter.votedFor || !target || !target.isAlive) return;

            voter.votedFor = targetId;
            target.votesReceived += 1;
            await room.save();

            const alivePlayers = room.players.filter(p => p.isAlive);
            const totalVotes = room.players.filter(p => p.isAlive && p.votedFor !== null).length;

            if (totalVotes === alivePlayers.length) {
                processElimination(io, roomCode);
            } else {
                io.to(roomCode).emit("voteUpdate", { votedCount: totalVotes, totalRequired: alivePlayers.length });
            }
        } catch (err) { console.error(err); }
    });
};

/* --- SHARED LOGIC --- */

const startTurn = async (io, roomCode) => {
    const room = await Room.findOne({ code: roomCode });
    if (!room || room.status !== 'PLAYING') return stopRoomTimer(roomCode);

    const currentPlayer = room.players[room.currentTurnIndex];
    let timeLeft = 30;

    stopRoomTimer(roomCode);

    io.to(roomCode).emit("turnChange", {
        activePlayerId: currentPlayer.socketId,
        playerName: currentPlayer.name,
        timeLeft
    });

    activeTimers[roomCode] = setInterval(async () => {
        timeLeft -= 1;
        io.to(roomCode).emit("timerTick", { timeLeft });

        if (timeLeft <= 0) {
            stopRoomTimer(roomCode);
            handleNextTurn(io, roomCode);
        }
    }, 1000);
};

const handleNextTurn = async (io, roomCode) => {
    const room = await Room.findOne({ code: roomCode });
    if (!room || room.status !== 'PLAYING') return stopRoomTimer(roomCode);

    // SMART SKIP: Find next alive player
    let nextIndex = -1;
    for (let i = room.currentTurnIndex + 1; i < room.players.length; i++) {
        if (room.players[i].isAlive) {
            nextIndex = i;
            break;
        }
    }

    if (nextIndex !== -1) {
        room.currentTurnIndex = nextIndex;
        await room.save();
        startTurn(io, roomCode);
    } else {
        // Everyone spoke, move to voting
        stopRoomTimer(roomCode);
        room.status = 'VOTING';
        await room.save();
        io.to(roomCode).emit("phaseChange", { status: 'VOTING' });
    }
};

const processElimination = async (io, roomCode) => {
    stopRoomTimer(roomCode);
    const room = await Room.findOne({ code: roomCode });
    if (!room) return;

    // Sort only living players by votes
    const aliveBefore = room.players.filter(p => p.isAlive);
    const sorted = [...aliveBefore].sort((a, b) => b.votesReceived - a.votesReceived);
    const eliminated = sorted[0];

    // Elimination
    const targetIdx = room.players.findIndex(p => p.socketId === eliminated.socketId);
    room.players[targetIdx].isAlive = false;

    const aliveAfter = room.players.filter(p => p.isAlive);
    const shadowAlive = aliveAfter.find(p => p.role === 'INFILTRATOR' || p.role === 'SPY');

    // WIN CONDITIONS
    if (!shadowAlive || aliveAfter.length <= 2) {
        const winner = !shadowAlive ? (room.gameMode === 'INFILTRATOR' ? "CITIZENS" : "AGENTS") : shadowAlive.role;
        room.status = 'FINISHED';
        await room.save();
        io.to(roomCode).emit("gameOver", { winner, eliminated: eliminated.name, roleWas: eliminated.role, players: room.players });
        return; // STOP MISSION
    } 

    // GAME CONTINUES: Setup Round 2/3/4...
    room.players.forEach(p => { p.votedFor = null; p.votesReceived = 0; });
    
    // Reset to the first ALIVE player's index
    room.currentTurnIndex = room.players.findIndex(p => p.isAlive);
    room.status = 'PLAYING';
    await room.save();

    io.to(roomCode).emit("roundResult", { eliminated: eliminated.name, roleWas: eliminated.role, players: room.players });
    
    // Restart automatic cycling
    startTurn(io, roomCode);
};
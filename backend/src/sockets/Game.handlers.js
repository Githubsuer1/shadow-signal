import Room from "../models/Room.model.js";
import wordsData from "../data/wordsData.json" with { type: "json" };
import { getSpyWord } from '../services/ai.services.js';

export const activeTimers = {};

/**
 * Utility: Stops the active timer for a specific room to prevent 
 * race conditions during phase transitions.
 */
const stopRoomTimer = (roomCode) => {
    if (activeTimers[roomCode]) {
        clearInterval(activeTimers[roomCode]);
        delete activeTimers[roomCode];
    }
};

export const setupGameHandlers = (io, socket) => {

    // --- 1. START GAME HANDLER ---
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

            // Initialize Player State for Round 1
            room.players.forEach((p, i) => {
                const isShadow = i === shadowIdx;
                p.role = isShadow ? (room.gameMode === 'SPY' ? 'SPY' : 'INFILTRATOR') : (room.gameMode === 'SPY' ? 'AGENT' : 'CITIZEN');
                p.word = isShadow ? specialWord : baseObj.word;
                p.isAlive = true;
                p.votesReceived = 0;
                p.votedFor = null;
                p.clue = ""; // Initialize empty clue
            });

            room.status = "PLAYING";
            room.currentTurnIndex = 0;
            await room.save();

            room.players.forEach((p) => {
                io.to(p.socketId).emit("gameStarted", {
                    status: "PLAYING",
                    role: p.role,
                    word: p.word,
                    players: room.players.map(pl => ({
                        name: pl.name,
                        socketId: pl.socketId,
                        isAlive: pl.isAlive,
                        clue: ""
                    })),
                    activePlayerId: room.players[0].socketId
                });
            });
            setTimeout(() => {
                startTurn(io, roomCode);
            }, 5000);

        } catch (error) {
            console.error("Start Game Error:", error);
            socket.emit("error", "Failed to start mission");
        }
    });

    // --- 2. CLUE SUBMISSION HANDLER ---
    /**
     * Triggered when the active player submits their one-word clue.
     * Updates DB and moves to the next turn immediately.
     */
    socket.on("submitClue", async ({ clue }) => {
        try {
            const { roomCode } = socket.data;
            const room = await Room.findOne({ code: roomCode });
            if (!room || room.status !== 'PLAYING') return;

            const currentPlayer = room.players[room.currentTurnIndex];

            // Security: Only the active player can submit a clue
            if (currentPlayer.socketId !== socket.id) return;

            // Store the clue in the database
            currentPlayer.clue = clue;
            room.markModified('players'); // Required for nested object updates in Mongoose
            await room.save();

            // Broadcast the clue to all players in real-time
            io.to(roomCode).emit("clueUpdated", {
                socketId: socket.id,
                clue: clue
            });

            // Proceed to next turn instantly
            handleNextTurn(io, roomCode);
        } catch (err) {
            console.error("Submit Clue Error:", err);
        }
    });

    // --- 3. VOTING HANDLER ---
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
        } catch (err) { console.error("Vote Error:", err); }
    });
};

/* --- SHARED CORE LOGIC --- */

/**
 * Manages the countdown for the current turn.
 */
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
            handleNextTurn(io, roomCode); // Auto-skip if time runs out
        }
    }, 1000);
};

/**
 * Logic to iterate to the next living player or transition to Voting phase.
 */
const handleNextTurn = async (io, roomCode) => {
    const room = await Room.findOne({ code: roomCode });
    if (!room || room.status !== 'PLAYING') return stopRoomTimer(roomCode);

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
        // All living players have provided a clue
        stopRoomTimer(roomCode);
        room.status = 'VOTING';
        await room.save();

        // Broadcast phase change with full player data (including clues)
        io.to(roomCode).emit("phaseChange", {
            status: 'VOTING',
            players: room.players.map(p => ({
                socketId: p.socketId,
                name: p.name,
                clue: p.clue,
                isAlive: p.isAlive
            }))
        });
    }
};

/**
 * Processes the end of a round, checks for winners, 
 * or resets clues and state for a new round.
 */
const processElimination = async (io, roomCode) => {
    stopRoomTimer(roomCode);
    const room = await Room.findOne({ code: roomCode });
    if (!room) return;

    const aliveBefore = room.players.filter(p => p.isAlive);
    const sorted = [...aliveBefore].sort((a, b) => b.votesReceived - a.votesReceived);
    const eliminated = sorted[0];

    // Update elimination status
    const targetIdx = room.players.findIndex(p => p.socketId === eliminated.socketId);
    room.players[targetIdx].isAlive = false;

    const aliveAfter = room.players.filter(p => p.isAlive);
    const shadowAlive = aliveAfter.find(p => p.role === 'INFILTRATOR' || p.role === 'SPY');

    // Win Condition Checks
    if (!shadowAlive || aliveAfter.length <= 2) {
        const winner = !shadowAlive ? (room.gameMode === 'INFILTRATOR' ? "CITIZENS" : "AGENTS") : shadowAlive.role;
        room.status = 'FINISHED';
        await room.save();
        io.to(roomCode).emit("gameOver", { winner, eliminated: eliminated.name, roleWas: eliminated.role, players: room.players });
        return;
    }

    // RESET FOR NEXT ROUND: Crucial for multi-round games
    room.players.forEach(p => {
        p.votedFor = null;
        p.votesReceived = 0;
        p.clue = ""; // Clear old clues so players can provide new ones
    });

    room.currentTurnIndex = room.players.findIndex(p => p.isAlive);
    room.status = 'PLAYING';
    await room.save();

    io.to(roomCode).emit("roundResult", { eliminated: eliminated.name, roleWas: eliminated.role, players: room.players });

    startTurn(io, roomCode);
};
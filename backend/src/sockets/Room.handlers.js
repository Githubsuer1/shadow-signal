import Room from "../models/Room.model.js";

export const setupRoomHandlers = (io, socket) => {
  socket.on("createRoom", async ({ playerName }) => {
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const room = await Room.create({
        code: roomCode,
        hostId: socket.id,
        status: "LOBBY",
        gameMode: "INFILTRATOR",
        players: [{
          socketId: socket.id,
          name: playerName,
          isHost: true,
          isAlive: true,
          votesReceived: 0,
          votedFor: null
        }]
      });

      socket.data.roomCode = roomCode;
      socket.join(roomCode);
      socket.emit("roomCreated", { roomCode, players: room.players });
    } catch (error) {
      socket.emit("error", "Failed to create room");
    }
  });

  socket.on("joinRoom", async ({ roomCode, playerName }) => {
    try {
      const room = await Room.findOne({ code: roomCode });
      if (!room) return socket.emit("error", "Room not found");
      if (room.status !== "LOBBY") return socket.emit("error", "Game already started");

      const nameExists = room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (nameExists) return socket.emit("error", "Name taken");

      const newPlayer = {
        socketId: socket.id,
        name: playerName,
        isHost: false,
        isAlive: true,
        votesReceived: 0,
        votedFor: null
      };

      room.players.push(newPlayer);
      await room.save();

      socket.data.roomCode = roomCode;
      socket.join(roomCode);
      socket.emit("joinSuccess", { roomCode, players: room.players, gameMode: room.gameMode });
      io.to(roomCode).emit("roomUpdate", { players: room.players });
    } catch (error) {
      socket.emit("error", "Failed to join");
    }
  });

  socket.on("setGameMode", async ({ gameMode }) => {
    try {
      const { roomCode } = socket.data;
      const room = await Room.findOne({ code: roomCode });
      if (room && room.hostId === socket.id) {
        room.gameMode = gameMode;
        await room.save();
        io.to(roomCode).emit("gameModeUpdated", { gameMode });
      }
    } catch (err) { console.error(err); }
  });
};
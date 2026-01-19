import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './src/dbconfig/connectDB.js';
import Room from './src/models/Room.model.js';
import { setupRoomHandlers } from './src/sockets/Room.handlers.js';
import { setupGameHandlers, activeTimers } from './src/sockets/Game.handlers.js';

dotenv.config();

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  setupRoomHandlers(io, socket);
  setupGameHandlers(io, socket);

  socket.on('disconnect', async () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;

    try {
      const room = await Room.findOne({ code: roomCode });
      if (!room) return;

      room.players = room.players.filter((p) => p.socketId !== socket.id);

      if (room.players.length === 0) {
        // Clear global timer
        if (activeTimers[roomCode]) {
          clearInterval(activeTimers[roomCode]);
          delete activeTimers[roomCode];
        }
        await Room.deleteOne({ code: roomCode });
        console.log(`Room ${roomCode} deleted (empty)`);
      } else {
        if (room.hostId === socket.id) {
          room.hostId = room.players[0].socketId;
          room.players[0].isHost = true;
        }
        await room.save();
        io.to(roomCode).emit("roomUpdate", { players: room.players, newHostId: room.hostId });
      }
    } catch (error) {
      console.error("Disconnect Cleanup Error:", error);
    }
  });
});

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Startup failed:', error.message);
  }
};
startServer();
import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  socketId: String,
  name: String,
  role: { type: String, default: 'PENDING' }, // CITIZEN, INFILTRATOR, etc.
  word: String,
  isHost: { type: Boolean, default: false },
  isAlive: { type: Boolean, default: true },
  votesReceived: { type: Number, default: 0 }, // How many people voted for this player
  votedFor: { type: String, default: null }    // The socketId of who this player picked
});

const RoomSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  status: { type: String, default: 'LOBBY' }, // LOBBY, SPEAKING, VOTING, FINISHED
  gameMode: { type: String, default: 'INFILTRATOR' },
  players: [PlayerSchema],
  hostId: String,
  winner: String,
  currentTurnIndex: { type: Number, default: 0 } // 
});

export default mongoose.model('Room', RoomSchema);
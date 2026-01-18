# 🕵️ Shadow Signal: AI-Powered Social Deduction Game

**Shadow Signal** is a real-time, full-stack multiplayer game. Players must use clever descriptions to identify the "Infiltrator" among them, while the Infiltrator tries to blend in using context clues from other players.

## 🚀 Live Links
* **Live Demo:** [Insert Vercel Link Here]
* **Backend API:** [Insert Render Link Here]

## 🛠️ Tech Stack
* **Frontend:** Next.js 14, Tailwind CSS, Socket.io-client
* **Backend:** Node.js, Express, Socket.io
* **Database:** MongoDB (Mongoose)
* **AI Integration:** Google Gemini AI (Dynamic word generation)

## ✨ Key Technical Highlights
* **Real-time State Sync:** Managed complex game phases (Speaking, Voting, Elimination) across clients using Socket.io.
* **AI Word Engine:** Uses Gemini API to generate "similar but different" words for Spy mode, ensuring unique gameplay.
* **Smart Turn Management:** Custom backend logic to skip eliminated players and handle automatic round cycling.
* **Concurrency Control:** Robust cleanup of global timers to prevent memory leaks and state overlaps.

## 🕹️ Game Rules
1. **The Secret:** Citizens get a word; the Infiltrator/Spy gets a slightly different one or none at all.
2. **The Signal:** Players take 30-second turns to type a clue about their word.
3. **The Vote:** After the round, players vote for the most suspicious person.
4. **Victory:** Citizens win if the Infiltrator is caught. The Infiltrator wins if they outlast the group.

## 📁 Project Structure
```text
shadow-signal/
├── frontend/         # Next.js Application
└── backend/          # Node.js & Socket.io Server
```

## Installation and local setup
git clone [https://github.com/yourusername/shadow-signal.git](https://github.com/yourusername/shadow-signal.git)
cd shadow-signal

## Backend setup:
cd backend
npm install
# Create a .env file and add:
# PORT=5000
# MONGODB_URI=your_mongodb_uri
# GEMINI_API_KEY=your_key
# FRONTEND_URL=http://localhost:3000
npm start

## Frontend setup:
cd ../frontend
npm install
# Create a .env.local file and add:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
npm run dev




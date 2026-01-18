import express from 'express';
import cors from 'cors';

// instance of express
const app = express();

/* ---------- Middleware ---------- */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

// to parse body data and allow access 
app.use(express.json());

/* ---------- Routes ---------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Shadow Signal backend running'
  });
});

export default app;

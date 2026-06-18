import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socketHandler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for frontend Vite development server (default 5173) and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// API Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

const server = http.createServer(app);

// Bind Socket.IO server with CORS configurations
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

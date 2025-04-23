import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import itemRouter from './routes/items.js';
import connectDB from './config/db.js';

const server = express();

connectDB(); // Connect to MongoDB

const PORT = process.env.PORT || 5000;

// Middleware
server.use(cors());
server.use(express.json());

// Routes
server.use('/api/items', itemRouter);

// Health check endpoint
server.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
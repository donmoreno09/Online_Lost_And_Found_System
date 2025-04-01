import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import userRouter from './router/users.js';
import connectDB from './config/db.js';

const server = express();

connectDB(); // Connessione al database MongoDB

const PORT = process.env.PORT || 5000;

// Middleware
server.use(cors()); // serve per permettere le richieste cross-origin
server.use(express.json()); // serve per parsare il body delle richieste in json

server.use(userRouter);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}
);
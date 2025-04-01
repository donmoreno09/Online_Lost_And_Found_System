import express from 'express';
import 'dotenv/config';
import userRouter from './router/users.js'; 

const server = express();

const PORT = process.env.PORT || 5000;

server.use(express.json()); // serve per parsare il body delle richieste in json

server.use(userRouter);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}
);
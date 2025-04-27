import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/users.js';
import itemRoutes from './routes/items.js';
import oAuthRoutes from './routes/oauths.js'; 
import googleStrategy from './config/passport.js'; 
import passport from 'passport'; 

// Verifica che JWT_SECRET sia impostato
if (!process.env.JWT_SECRET) {
    console.error('ERRORE: JWT_SECRET non definito nel file .env');
    process.exit(1);
}

// Inizializza Express
const app = express();

// Configura CORS
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Configura Passport per Google OAuth
passport.use(googleStrategy); 
app.use(passport.initialize());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/auths', oAuthRoutes); 

// Connessione al database
connectDB();

// Avvio del server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
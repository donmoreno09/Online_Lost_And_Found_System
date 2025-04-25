import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';
import uploadCloudinary from '../middleware/uploadCloudinary.js';
import mailer from '../helpers/mailer.js';

const router = express.Router();

// GET /me - Ottiene l'utente dal token
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ 
          success: false, 
          message: 'Utente non trovato' 
        });
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error('Errore recupero utente:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Errore del server' 
        });
    }
});

// POST /register - Registrazione nuovo utente
router.post('/register', uploadCloudinary.single('avatar'), async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        
        // Verifica se l'email esiste già
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Email già registrata" 
            });
        }

        // Cripta la password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = { 
            firstName, 
            lastName, 
            email, 
            password: hashedPassword,
            phone: phone || null
        };
        
        // Aggiungi avatar se caricato
        if (req.file) {
            userData.avatar = req.file.path;
        }

        const newUser = await User.create(userData);
        
        // Genera token JWT per login automatico
        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Rimuovi password dalla risposta
        const userResponse = newUser.toObject();
        delete userResponse.password;

        // Invia email di benvenuto
        try {
            await mailer.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Benvenuto nella nostra piattaforma!',
                text: `Ciao ${firstName}, benvenuto nella nostra piattaforma!`,
                html: `<h1>Ciao ${firstName}!</h1><p>Benvenuto nella nostra piattaforma!</p>`
            });
            console.log('Email di benvenuto inviata a:', email);
        } catch (emailError) {
            console.error('Errore nell\'invio dell\'email di benvenuto:', emailError);
            // Non bloccare la registrazione se l'invio dell'email fallisce
        }
        
        res.status(201).json({
            success: true,
            token,
            data: userResponse
        });
    } catch (err) {
        console.error('Errore registrazione:', err);
        res.status(500).json({ 
          success: false, 
          message: err.message 
        });
    }
});

// POST /login - Login utente
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Trova l'utente per email, includendo esplicitamente la password
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Credenziali non valide" 
            });
        }
        
        // Verifica la password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Credenziali non valide" 
            });
        }

        // Genera il token JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Rimuovi password dalla risposta
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(200).json({
            success: true,
            token,
            data: userResponse
        });
        
    } catch (err) {
        console.error('Errore login:', err);
        res.status(500).json({ 
          success: false, 
          message: err.message 
        });
    }
});

// PUT /users/:id - Aggiorna profilo utente
router.put('/:id', auth, uploadCloudinary.single('avatar'), async (req, res) => {
    try {
        // Verifica che l'utente stia modificando il proprio profilo
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Non sei autorizzato a modificare questo profilo" 
            });
        }

        const { firstName, lastName, email, phone, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.params.id).select('+password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "Utente non trovato" 
            });
        }

        // Verifica password attuale se si sta tentando di cambiarla
        if (newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Password attuale non corretta" 
                });
            }
            
            // Cripta la nuova password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Aggiorna i campi solo se forniti
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (phone !== undefined) user.phone = phone;

        // Aggiorna l'avatar se caricato
        if (req.file) {
            user.avatar = req.file.path;
        }

        await user.save();

        // Rimuovi password dalla risposta
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            data: userResponse
        });
    } catch (err) {
        console.error('Errore aggiornamento profilo:', err);
        res.status(500).json({ 
          success: false, 
          message: err.message 
        });
    }
});

// DELETE /users/:id - Elimina utente
router.delete('/:id', auth, async (req, res) => {
    try {
        // Verifica che l'utente stia eliminando il proprio profilo o sia un admin
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Non sei autorizzato a eliminare questo utente" 
            });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utente non trovato' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Utente eliminato con successo' 
        });
    } catch (err) {
        console.error('Errore eliminazione utente:', err);
        res.status(500).json({ 
          success: false, 
          message: err.message 
        });
    }
});

export default router;
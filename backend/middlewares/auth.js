import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Verifica se c'è l'header Authorization e se è di tipo Bearer
    if (!req.headers.authorization) {
      return res.status(401).json({ 
        success: false, 
        message: 'Autenticazione richiesta' 
      });
    }
    
    const parts = req.headers.authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        success: false, 
        message: 'Formato token non valido' 
      });
    }
    
    const token = parts[1];
    
    // Verifica la firma del token
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
      if (err) {
        console.error('Token verification error:', err.name, err.message);
        return res.status(401).json({ 
          success: false, 
          message: 'Token non valido o scaduto'
        });
      }
      
      try {
        // Recupera i dati dell'utente dal database
        const user = await User.findById(payload.userId).select('-password');
        
        if (!user) {
          return res.status(401).json({ 
            success: false, 
            message: 'Utente non trovato' 
          });
        }
        
        // Aggiungiamo l'utente alla request per i middleware successivi
        req.user = user;
        
        // Passa al prossimo middleware
        next();
      } catch (error) {
        console.error('User lookup error:', error);
        return res.status(401).json({
          success: false,
          message: 'Errore di autenticazione'
        });
      }
    });
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore del server' 
    });
  }
};

export default auth;
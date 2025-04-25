import express from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item.js';
import User from '../models/User.js';
import mailer from '../helpers/mailer.js'; // Nota: sto usando lo stesso percorso del file users.js

const router = express.Router();

// GET all items with optional filtering
// Cambia da '/api/items' a semplicemente '/'
router.get('/', async (req, res) => {
  try {
    console.log("GET /api/items route hit"); // Log per debug
    const { type, category, status, search } = req.query;
    
    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    // Add text search if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log("Filter:", filter); // Log per debug
    
    const items = await Item.find(filter);
    console.log(`Found ${items.length} items`); // Log per debug
      
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error("Error in GET /api/items:", error); // Log per debug
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET a single item by ID
// Cambia da '/api/items/:id' a semplicemente '/:id'
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const item = await Item.findById(req.params.id)
      .populate('user', 'firstName lastName email phone avatar');
      
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST a new item (simplified without authentication for now)
// Cambia da '/api/items' a semplicemente '/'
router.post('/', async (req, res) => {
  try {
    console.log("POST /api/items route hit, body:", req.body); // Log per debug
    
    // For now, we'll just use the user ID from the request body
    // Later, this will come from authentication middleware
    const userId = req.body.user;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    const newItem = new Item({
      ...req.body
    });
    
    const savedItem = await newItem.save();
    console.log("Item saved successfully:", savedItem); // Log per debug
    
    // Invia email di conferma all'utente
    try {
      // Recupera i dati dell'utente
      const user = await User.findById(userId);
      if (user && user.email) {
        // Formatta la data in modo leggibile
        const formattedDate = new Date(savedItem.date).toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        
        // Determina il tipo di annuncio (oggetto smarrito o trovato)
        const announcementType = savedItem.type === 'lost' ? 'smarrito' : 'trovato';
        
        // Traduci la categoria in italiano
        const categoryTranslations = {
          'electronics': 'Elettronica',
          'jewelry': 'Gioielli',
          'clothing': 'Abbigliamento',
          'accessories': 'Accessori',
          'documents': 'Documenti',
          'other': 'Altro'
        };
        
        const categoryItalian = categoryTranslations[savedItem.category] || savedItem.category;
        
        // Invia l'email
        await mailer.sendMail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: `Conferma pubblicazione: ${savedItem.title}`,
          text: `Grazie per aver pubblicato un annuncio di oggetto ${announcementType} sulla piattaforma Lost & Found.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0d6efd;">Annuncio Pubblicato con Successo!</h1>
              </div>
              
              <p>Ciao ${user.firstName},</p>
              
              <p>Grazie per aver pubblicato un annuncio di oggetto <strong>${announcementType}</strong> sulla nostra piattaforma Lost & Found. Di seguito trovi un riepilogo del tuo annuncio:</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0d6efd;">${savedItem.title}</h3>
                <p><strong>Categoria:</strong> ${categoryItalian}</p>
                <p><strong>Descrizione:</strong> ${savedItem.description}</p>
                ${savedItem.location ? `<p><strong>Luogo:</strong> ${savedItem.location.city || ''} ${savedItem.location.address ? ', ' + savedItem.location.address : ''}</p>` : ''}
                <p><strong>Data:</strong> ${formattedDate}</p>
                <p><strong>Stato:</strong> ${savedItem.status === 'open' ? 'Aperto' : savedItem.status}</p>
                ${savedItem.images && savedItem.images.length > 0 ? `<p><strong>Immagini:</strong> ${savedItem.images.length} immagini caricate</p>` : ''}
              </div>
              
              <p>Il tuo annuncio è ora visibile a tutti gli utenti della piattaforma. Riceverai una notifica se qualcuno mostrerà interesse per il tuo oggetto ${announcementType}.</p>
              
              <p>Puoi visualizzare e gestire i tuoi annunci dalla tua dashboard personale.</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Vai alla Dashboard</a>
              </div>
              
              <p>Cordiali saluti,<br>Il Team di Lost & Found</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6c757d; text-align: center;">
                <p>Questo è un messaggio automatico, si prega di non rispondere direttamente a questa email.</p>
                <p>&copy; ${new Date().getFullYear()} Lost & Found System. Tutti i diritti riservati.</p>
              </div>
            </div>
          `
        });
        console.log('Email di conferma annuncio inviata a:', user.email);
      } else {
        console.log('Email utente non trovata, impossibile inviare email di conferma');
      }
    } catch (emailError) {
      console.error('Errore nell\'invio dell\'email di conferma annuncio:', emailError);
      // Non blocchiamo la creazione dell'annuncio se l'invio dell'email fallisce
    }
    
    res.status(201).json({
      success: true,
      data: savedItem
    });
  } catch (error) {
    console.error("Error saving item:", error); // Log per debug
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
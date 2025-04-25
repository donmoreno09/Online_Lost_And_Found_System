import express from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item.js';
import User from '../models/User.js';
import mailer from '../helpers/mailer.js';
import auth from '../middlewares/auth.js';
import uploadCloudinary from '../middlewares/uploadCloudinary.js';

const router = express.Router();

// GET all items with optional filtering
router.get('/', async (req, res) => {
  try {
    console.log("GET /items route hit");
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
    
    console.log("Filter:", filter);
    
    const items = await Item.find(filter)
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });
      
    console.log(`Found ${items.length} items`);
      
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error("Error in GET /items:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET user items
router.get('/my-items', auth, async (req, res) => {
  try {
    const items = await Item.find({ user: req.user._id })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error("Error in GET /items/my-items:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET a single item by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const item = await Item.findById(req.params.id)
      .populate('user', 'firstName lastName email');
    
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
    console.error("Error in GET /items/:id:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST a new item - ora con auth e uploadCloudinary
router.post('/', auth, uploadCloudinary.array('images', 5), async (req, res) => {
  try {
    console.log("POST /items route hit, body:", req.body);
    
    // Estrai i campi dal corpo della richiesta
    const { title, description, category, type } = req.body;
    
    // Ottieni l'utente dall'oggetto req impostato dal middleware auth
    const userId = req.user._id;
    
    // Validazione dei dati
    if (!title || !description || !category || !type) {
      return res.status(400).json({
        success: false,
        message: "Tutti i campi obbligatori devono essere compilati"
      });
    }
    
    // Prepara l'oggetto location
    let location = {};
    
    // CORREZIONE: Controlla se location è una stringa JSON
    if (req.body.location && typeof req.body.location === 'string') {
      try {
        location = JSON.parse(req.body.location);
      } catch (e) {
        console.error("Error parsing location JSON:", e);
        location = {};
      }
    } 
    // Fallback al vecchio metodo se la location non è un JSON
    else if (req.body['location[address]']) {
      location = {
        address: req.body['location[address]'] || '',
        city: req.body['location[city]'] || '',
        state: req.body['location[state]'] || ''
      };
    }
    
    // Crea il nuovo oggetto Item
    const newItem = new Item({
      title,
      description,
      category,
      type,
      location,
      user: userId,
      status: 'open'
    });
    
    // Aggiungi le immagini se presenti
    if (req.files && req.files.length > 0) {
      newItem.images = req.files.map(file => file.path);
    }
    
    const savedItem = await newItem.save();
    console.log("Item saved successfully:", savedItem);
    
    // Invia email di conferma all'utente
    try {
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
      
      // Costruisci il testo della posizione
      const locationText = location.city ? 
        `${location.city}${location.address ? ', ' + location.address : ''}` : 
        'Non specificata';
      
      // Invia l'email
      await mailer.sendMail({
        from: process.env.EMAIL_FROM,
        to: req.user.email,
        subject: `Conferma pubblicazione: ${savedItem.title}`,
        text: `Grazie per aver pubblicato un annuncio di oggetto ${announcementType} sulla piattaforma Lost & Found.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #0d6efd;">Annuncio Pubblicato con Successo!</h1>
            </div>
            
            <p>Ciao ${req.user.firstName},</p>
            
            <p>Grazie per aver pubblicato un annuncio di oggetto <strong>${announcementType}</strong> sulla nostra piattaforma Lost & Found. Di seguito trovi un riepilogo del tuo annuncio:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0d6efd;">${savedItem.title}</h3>
              <p><strong>Categoria:</strong> ${categoryItalian}</p>
              <p><strong>Descrizione:</strong> ${savedItem.description}</p>
              <p><strong>Luogo:</strong> ${locationText}</p>
              <p><strong>Data:</strong> ${formattedDate}</p>
              <p><strong>Stato:</strong> ${savedItem.status === 'open' ? 'Aperto' : savedItem.status}</p>
              ${savedItem.images && savedItem.images.length > 0 ? `<p><strong>Immagini:</strong> ${savedItem.images.length} immagini caricate</p>` : ''}
            </div>
            
            <p>Il tuo annuncio è ora visibile a tutti gli utenti della piattaforma. Riceverai una notifica se qualcuno mostrerà interesse per il tuo oggetto ${announcementType}.</p>
            
            <p>Puoi visualizzare e gestire i tuoi annunci dalla tua dashboard personale.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-items" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Vai ai Miei Annunci</a>
            </div>
            
            <p>Cordiali saluti,<br>Il Team di Lost & Found</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6c757d; text-align: center;">
              <p>Questo è un messaggio automatico, si prega di non rispondere direttamente a questa email.</p>
              <p>&copy; ${new Date().getFullYear()} Lost & Found System. Tutti i diritti riservati.</p>
            </div>
          </div>
        `
      });
      console.log('Email di conferma annuncio inviata a:', req.user.email);
    } catch (emailError) {
      console.error('Errore nell\'invio dell\'email di conferma annuncio:', emailError);
      // Non blocchiamo la creazione dell'annuncio se l'invio dell'email fallisce
    }
    
    // Popola il campo utente prima di inviare la risposta
    const populatedItem = await Item.findById(savedItem._id)
      .populate('user', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: populatedItem
    });
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// PUT/PATCH update item
router.put('/:id', auth, uploadCloudinary.array('images', 5), async (req, res) => {
  try {
    // Estrai i campi dal corpo della richiesta
    const { title, description, category, type, status } = req.body;
    
    // Trova l'oggetto esistente
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Verifica che l'utente sia il proprietario dell'oggetto
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non sei autorizzato a modificare questo annuncio"
      });
    }
    
    // Prepara l'oggetto di aggiornamento
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    
    // Aggiorna la location se fornita
    if (req.body['location[address]'] || req.body['location[city]'] || req.body['location[state]']) {
      updateData.location = {
        address: req.body['location[address]'] || item.location.address || '',
        city: req.body['location[city]'] || item.location.city || '',
        state: req.body['location[state]'] || item.location.state || ''
      };
    }
    
    // Aggiungi le nuove immagini se presenti
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updateData.images = [...(item.images || []), ...newImages];
    }
    
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'firstName lastName');
    
    res.status(200).json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE an item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Verifica che l'utente sia il proprietario dell'oggetto
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non sei autorizzato a eliminare questo annuncio"
      });
    }
    
    await Item.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
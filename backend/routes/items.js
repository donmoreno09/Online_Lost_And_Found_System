import express from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item.js';
import User from '../models/User.js';
import mailer from '../helpers/mailer.js';
import auth from '../middlewares/auth.js';
import crypto from 'crypto';
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
    
    // Modifica la query per includere sia "available" che "pending"
    const query = { 
      ...filter, 
      status: { $in: ['available', 'pending'] }  // Mostra sia gli oggetti disponibili che quelli in attesa
    };
    
    const items = await Item.find(query)
      .populate('user', 'firstName lastName email phone')
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
    const { status } = req.query;
    const query = { user: req.user._id };
    
    // Applica filtro per stato se specificato
    if (status && ['available', 'pending', 'claimed', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    const items = await Item.find(query)
      .populate('user', 'firstName lastName email phone')  // Aggiungi populate
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Errore del server'
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
    
    try {
      console.log("Fetching item details for ID:", req.params.id);
      
      // Recupera l'item prima per verificare se esiste
      const item = await Item.findById(req.params.id)
        .populate('user', 'firstName lastName email phone');
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      console.log("Item found, user ID:", item.user);
      
      // Verifica che l'ID utente sia valido
      if (!item.user || !mongoose.Types.ObjectId.isValid(item.user)) {
        console.log("Invalid user ID in item");
        
        // Restituisci l'item senza tentare di popolare l'utente
        return res.status(200).json({
          success: true,
          data: item
        });
      }
      
      // Verifica che l'utente esista veramente
      const userExists = await mongoose.model('User').findById(item.user);
      
      if (!userExists) {
        console.log("User not found in database, returning item without user");
        
        // Restituisci l'item senza utente
        return res.status(200).json({
          success: true,
          data: item
        });
      }
      
      // Se l'utente esiste, recupera l'item con popolazione
      const populatedItem = await Item.findById(req.params.id)
        .populate({
          path: 'user',
          select: 'firstName lastName email phone',
          options: { strictPopulate: false }
        });
      
      console.log("User populated:", populatedItem.user ? "yes" : "no");
      
      res.status(200).json({
        success: true,
        data: populatedItem
      });
    } catch (queryError) {
      console.error("Query error:", queryError);
      return res.status(400).json({
        success: false,
        message: 'Errore di query: ' + queryError.message
      });
    }
  } catch (error) {
    console.error("Error in GET /items/:id:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST a new item
router.post('/', auth, uploadCloudinary.array('images', 5), async (req, res) => {
  try {
    console.log("POST /items route hit, body:", req.body);
    
    // Estrai i campi dal corpo della richiesta
    const { title, description, category, type, date } = req.body;
    
    // Ottieni l'utente dall'oggetto req impostato dal middleware auth
    const userId = req.user._id;
    
    // Validazione dei dati
    if (!title || !description || !category || !type) {
      return res.status(400).json({
        success: false,
        message: "Tutti i campi obbligatori devono essere compilati"
      });
    }
    
    // CORREZIONE: Gestione della location
    let locationData = { address: '', city: '', state: '' };
    
    // Opzione 1: Location come JSON string in locationJson
    if (req.body.locationJson) {
      try {
        locationData = JSON.parse(req.body.locationJson);
        console.log("Location parsed from JSON:", locationData);
      } catch (e) {
        console.error("Error parsing locationJson:", e);
      }
    } 
    // Opzione 2: Campi singoli
    else if (req.body.address || req.body.city || req.body.state) {
      locationData = {
        address: req.body.address || '',
        city: req.body.city || '',
        state: req.body.state || ''
      };
      console.log("Location from individual fields:", locationData);
    }
    
    // Log per debug
    console.log("Final location data:", locationData);
    
    // Crea il nuovo oggetto Item
    const newItem = new Item({
      title,
      description,
      category,
      type,
      date: date || new Date(),
      location: locationData, // Ora locationData è correttamente strutturato
      user: req.user._id,
      status: 'available'
    });
    
    // Aggiungi le immagini se presenti
    if (req.files && req.files.length > 0) {
      newItem.images = req.files.map(file => file.path);
    }
    
    console.log("Item before save:", JSON.stringify(newItem, null, 2));
    
    const savedItem = await newItem.save();
    
    console.log("Item saved successfully:", savedItem._id);
    
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
    console.error("Error creating item:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT/PATCH update item - correzione per la location
router.put('/:id', auth, uploadCloudinary.array('images', 5), async (req, res) => {
  try {
    // Validazione dell'ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    // Trova l'item
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Verifica che l'utente sia il proprietario dell'item
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this item'
      });
    }
    
    console.log("Request body:", req.body);
    console.log("Current item location:", item.location);
    
    // Prepara i dati per l'aggiornamento
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      type: req.body.type,
      date: req.body.date
    };
    
    // CORREZIONE: Inizializzazione sicura di location
    let location = {
      address: item.location?.address || '',
      city: item.location?.city || '',
      state: item.location?.state || ''
    };
    
    console.log("Current location values:", location);
    
    // NUOVA AGGIUNTA: Gestisci il caso in cui location è un oggetto annidato
    if (req.body.location && typeof req.body.location === 'object') {
      location = {
        address: req.body.location.address || location.address,
        city: req.body.location.city || location.city,
        state: req.body.location.state || location.state
      };
      console.log("Location updated from nested object:", location);
    }
    // Altre opzioni (già presenti)
    else if (req.body.locationJson) {
      try {
        const parsedLocation = JSON.parse(req.body.locationJson);
        location = {
          address: parsedLocation.address || location.address,
          city: parsedLocation.city || location.city,
          state: parsedLocation.state || location.state
        };
        console.log("Location updated from JSON:", location);
      } catch (e) {
        console.error("Error parsing locationJson:", e);
      }
    } 
    else if (req.body.location && typeof req.body.location === 'string') {
      try {
        const parsedLocation = JSON.parse(req.body.location);
        location = {
          address: parsedLocation.address || location.address,
          city: parsedLocation.city || location.city,
          state: parsedLocation.state || location.state
        };
        console.log("Location updated from location string:", location);
      } catch (e) {
        console.error("Error parsing location JSON:", e);
      }
    } 
    else if (req.body['location[address]'] !== undefined || req.body['location[city]'] !== undefined || req.body['location[state]'] !== undefined) {
      location = {
        address: req.body['location[address]'] !== undefined ? req.body['location[address]'] : location.address,
        city: req.body['location[city]'] !== undefined ? req.body['location[city]'] : location.city,
        state: req.body['location[state]'] !== undefined ? req.body['location[state]'] : location.state
      };
      console.log("Location updated from form fields:", location);
    } 
    else if (req.body.address !== undefined || req.body.city !== undefined || req.body.state !== undefined) {
      location = {
        address: req.body.address !== undefined ? req.body.address : location.address,
        city: req.body.city !== undefined ? req.body.city : location.city,
        state: req.body.state !== undefined ? req.body.state : location.state
      };
      console.log("Location updated from individual fields:", location);
    }
    
    console.log("Final location for update:", location);
    updateData.location = location;
    
    // Gestione delle immagini
    if (req.files && req.files.length > 0) {
      // Aggiungi le nuove immagini alle esistenti
      updateData.images = [...(item.images || []), ...req.files.map(file => file.path)];
    } else if (req.body.images && typeof req.body.images === 'string') {
      // Se images è una stringa, convertila in array
      updateData.images = [req.body.images];
    } else if (Array.isArray(req.body.images)) {
      // Se è già un array, usalo direttamente
      updateData.images = req.body.images;
    }
    
    console.log("Full update data:", updateData);
    
    // Aggiorna l'item
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log("Updated item:", updatedItem);
    
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

// Aggiungi questa route per gestire i reclami
// Inseriscila prima delle route di accettazione/rifiuto

// POST per reclamare un oggetto
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user._id;
    const { firstName, lastName, email, phone, message } = req.body;
    
    // Validazioni
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Per favore, compila tutti i campi richiesti'
      });
    }
    
    // Trova l'oggetto e popola il campo user
    const item = await Item.findById(itemId).populate('user');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Oggetto non trovato'
      });
    }
    
    // Verifica che l'utente non stia reclamando il proprio oggetto
    // Controlla prima se item.user esiste e confronta gli ID in modo sicuro
    if (item.user && item.user._id && item.user._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi reclamare un oggetto di tua proprietà'
      });
    }
    
    // Verifica che l'oggetto sia ancora in stato "available"
    if (item.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Questo oggetto non è più disponibile per essere reclamato'
      });
    }
    
    // Genera token univoci per accettazione e rifiuto
    const acceptToken = crypto.randomBytes(32).toString('hex');
    const rejectToken = crypto.randomBytes(32).toString('hex');
    
    // Aggiorna l'oggetto con i dati del reclamo
    await Item.updateOne({ _id: itemId }, {
      $set: {
        status: 'pending',
        claimStatus: 'pending',
        claimant: userId,
        claimInfo: {
          firstName,
          lastName,
          email,
          phone: phone || '',
          message,
          date: new Date()
        },
        claimToken: {
          accept: acceptToken,
          reject: rejectToken,
          expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 giorni di validità
        }
      }
    });
    
    // Invia email di notifica al proprietario con i link di accettazione/rifiuto
    try {
      if (item.user && item.user.email) {
        const announcementType = item.type === 'lost' ? 'smarrito' : 'trovato';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        const acceptUrl = `${frontendUrl}/claim/accept/${acceptToken}`;
        const rejectUrl = `${frontendUrl}/claim/reject/${rejectToken}`;
        
        // Log per debug
        console.log("Sending email to owner:", item.user.email);
        console.log("Accept URL:", acceptUrl);
        console.log("Reject URL:", rejectUrl);
        
        await mailer.sendMail({
          from: process.env.EMAIL_FROM,
          to: item.user.email,
          subject: `Qualcuno ha reclamato il tuo oggetto: ${item.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0d6efd;">Richiesta di Reclamo</h1>
              </div>
              
              <p>Ciao ${item.user.firstName},</p>
              
              <p>Qualcuno ha reclamato il tuo oggetto <strong>${announcementType}</strong> "<strong>${item.title}</strong>".</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0d6efd;">Informazioni del richiedente:</h3>
                <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${phone ? `<p><strong>Telefono:</strong> ${phone}</p>` : ''}
                <p><strong>Messaggio:</strong> ${message}</p>
              </div>
              
              <p>Se riconosci questa persona come il legittimo proprietario dell'oggetto, puoi accettare la richiesta cliccando sul pulsante qui sotto:</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${acceptUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Accetta Richiesta</a>
              </div>
              
              <p>Se non riconosci questa persona o non desideri procedere con il reclamo, puoi rifiutare la richiesta:</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${rejectUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Rifiuta Richiesta</a>
              </div>
              
              <p>Puoi anche rispondere direttamente a questa email per comunicare con il richiedente.</p>
              
              <p>Cordiali saluti,<br>Il Team di Lost & Found</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6c757d; text-align: center;">
                <p>Questo è un messaggio automatico relativo a un reclamo sulla piattaforma Lost & Found.</p>
                <p>&copy; ${new Date().getFullYear()} Lost & Found System. Tutti i diritti riservati.</p>
              </div>
            </div>
          `
        });
        
        console.log('Email di notifica reclamo inviata a:', item.user.email);
      }
      
      // Email di conferma all'utente che reclama
      if (email) {
        const announcementType = item.type === 'lost' ? 'smarrito' : 'trovato';
        
        await mailer.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: `Conferma richiesta per l'oggetto: ${item.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0d6efd;">Richiesta Inviata</h1>
              </div>
              
              <p>Ciao ${firstName},</p>
              
              <p>Abbiamo ricevuto la tua richiesta per l'oggetto <strong>${announcementType}</strong> "<strong>${item.title}</strong>".</p>
              
              <p>Abbiamo inviato una notifica al proprietario dell'oggetto, che valuterà la tua richiesta. Riceverai un'email quando il proprietario risponderà alla tua richiesta.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0d6efd;">Riepilogo della richiesta:</h3>
                <p><strong>Oggetto:</strong> ${item.title}</p>
                <p><strong>Messaggio inviato:</strong> ${message}</p>
              </div>
              
              <p>Nel frattempo, ti invitiamo a tenere d'occhio la tua casella email per eventuali aggiornamenti.</p>
              
              <p>Cordiali saluti,<br>Il Team di Lost & Found</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6c757d; text-align: center;">
                <p>Questo è un messaggio automatico, si prega di non rispondere direttamente a questa email.</p>
                <p>&copy; ${new Date().getFullYear()} Lost & Found System. Tutti i diritti riservati.</p>
              </div>
            </div>
          `
        });
        
        console.log('Email di conferma reclamo inviata a:', email);
      }
    } catch (emailError) {
      console.error('Errore nell\'invio delle email di notifica:', emailError);
      // Non blocchiamo l'operazione se l'invio dell'email fallisce
    }
    
    // Invia risposta
    res.status(200).json({
      success: true,
      message: 'Richiesta inviata con successo'
    });
    
  } catch (error) {
    console.error("Error claiming item:", error);
    res.status(500).json({
      success: false,
      message: error.message || 'Si è verificato un errore durante la richiesta'
    });
  }
});

// Route per accettare la richiesta di reclamo
router.put('/claim/accept/:token', async (req, res) => {
  try {
    const token = req.params.token;
    console.log("Accettazione richiesta, token:", token);
    
    // Cerca l'oggetto associato a questo token di accettazione
    const item = await Item.findOne({
      'claimToken.accept': token
    }).populate('user').populate('claimant');
    
    if (!item) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido o scaduto'
      });
    }
    
    // Verifica che il token non sia scaduto
    if (item.claimToken.expiry && new Date(item.claimToken.expiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Token scaduto, genera una nuova richiesta'
      });
    }
    
    console.log("Item trovato:", item.title);
    
    // Cambio stato dell'item
    item.status = 'claimed';
    item.claimStatus = 'accepted';
    await item.save();
    
    console.log("Stato aggiornato a:", item.status, item.claimStatus);
    
    // Invia email al reclamante
    if (item.claimInfo && item.claimInfo.email) {
      try {
        const ownerName = item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Il proprietario';
        const ownerEmail = item.user ? item.user.email : 'Non disponibile';
        const ownerPhone = item.user ? item.user.phone || 'Non disponibile' : 'Non disponibile';
        
        await mailer.sendMail({
          from: process.env.EMAIL_FROM,
          to: item.claimInfo.email,
          subject: `Richiesta accettata per: ${item.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #28a745;">Richiesta Accettata!</h1>
              </div>
              
              <p>Ciao ${item.claimInfo.firstName},</p>
              
              <p>Siamo lieti di informarti che la tua richiesta per l'oggetto "<strong>${item.title}</strong>" è stata accettata.</p>
              
              <p>Puoi metterti in contatto con il proprietario utilizzando i seguenti dettagli:</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Nome:</strong> ${ownerName}</p>
                <p><strong>Email:</strong> ${ownerEmail}</p>
                <p><strong>Telefono:</strong> ${ownerPhone}</p>
              </div>
              
              <p>Ti consigliamo di contattare il proprietario al più presto per organizzare la restituzione dell'oggetto.</p>
              
              <p>Cordiali saluti,<br>Il Team di Lost & Found</p>
            </div>
          `
        });
        
        console.log("Email inviata a:", item.claimInfo.email);
      } catch (emailError) {
        console.error("Errore email:", emailError);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Richiesta accettata con successo',
      item: {
        _id: item._id,
        title: item.title
      }
    });
  } catch (error) {
    console.error("Errore:", error);
    return res.status(500).json({
      success: false,
      message: 'Errore del server'
    });
  }
});

// Route per rifiutare la richiesta di reclamo
router.put('/claim/reject/:token', async (req, res) => {
  try {
    const token = req.params.token;
    console.log("Richiesta di rifiuto, token:", token);
    
    // Cerca l'oggetto associato a questo token di rifiuto
    const item = await Item.findOne({
      'claimToken.reject': token
    });
    
    if (!item) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido o scaduto'
      });
    }
    
    // Verifica che il token non sia scaduto
    if (item.claimToken.expiry && new Date(item.claimToken.expiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Token scaduto'
      });
    }
    
    // 1. CAMBIO STATO DELL'OGGETTO
    item.status = 'available';      // Riporta lo stato a "available" (Disponibile)
    item.claimStatus = 'rejected';  // Aggiorna lo stato del reclamo
    
    await item.save();
    
    // 2. INVIO EMAIL ALLA PERSONA CHE HA FATTO IL RECLAMO
    if (item.claimInfo && item.claimInfo.email) {
      try {
        await mailer.sendMail({
          from: process.env.EMAIL_FROM,
          to: item.claimInfo.email,
          subject: `Richiesta rifiutata per: ${item.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #dc3545;">Richiesta Non Accettata</h1>
              </div>
              
              <p>Ciao ${item.claimInfo.firstName},</p>
              
              <p>Purtroppo la tua richiesta per l'oggetto "<strong>${item.title}</strong>" non è stata accettata.</p>
              
              <p>Questo può accadere per diverse ragioni, incluso il caso in cui il proprietario non riconosca la corrispondenza tra le tue informazioni e l'oggetto in questione.</p>
              
              <p>Se ritieni ci sia stato un errore, puoi provare a contattare l'amministratore del sistema o effettuare una nuova richiesta con maggiori dettagli.</p>
              
              <p>Cordiali saluti,<br>Il Team di Lost & Found</p>
            </div>
          `
        });
        
        console.log('Email di rifiuto inviata a:', item.claimInfo.email);
      } catch (emailError) {
        console.error('Errore invio email:', emailError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Richiesta rifiutata con successo'
    });
    
  } catch (error) {
    console.error("Errore nel rifiuto del reclamo:", error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'elaborazione della richiesta'
    });
  }
});

// Funzione per recuperare l'itemId dal token
async function getItemIdFromToken(token) {
  try {
    // Cerca l'item che ha questo token di accettazione
    const item = await Item.findOne({ 'claimToken.accept': token });
    
    if (!item) return null;
    
    // Verifica che il token non sia scaduto
    if (item.claimToken.expiry && new Date(item.claimToken.expiry) < new Date()) {
      console.log('Token scaduto');
      return null;
    }
    
    return item._id;
  } catch (error) {
    console.error('Errore nel recupero dell\'item dal token:', error);
    return null;
  }
}

// Funzione per recuperare l'item dal token di rifiuto

async function getItemIdFromRejectToken(token) {
  try {
    const item = await Item.findOne({ 'claimToken.reject': token });
    
    if (!item) return null;
    
    if (item.claimToken.expiry && new Date(item.claimToken.expiry) < new Date()) {
      console.log('Token scaduto');
      return null;
    }
    
    return item._id;
  } catch (error) {
    console.error('Errore nel recupero dell\'item dal token di rifiuto:', error);
    return null;
  }
}

// GET items claimed by user
router.get('/claimed-by-me', auth, async (req, res) => {
  try {
    const items = await Item.find({ 
      claimedBy: req.user._id 
    }).populate('user', 'firstName lastName email phone').sort({ 'claimInfo.date': -1 });
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Errore del server'
    });
  }
});

export default router;
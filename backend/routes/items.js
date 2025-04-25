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

// POST a new item
router.post('/', auth, uploadCloudinary.array('images', 5), async (req, res) => {
  try {
    console.log("POST /items route hit, body:", req.body);
    
    // Estrai i campi dal corpo della richiesta
    const { title, description, category, type, date } = req.body;
    
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
      status: 'open'
    });
    
    // Aggiungi le immagini se presenti
    if (req.files && req.files.length > 0) {
      newItem.images = req.files.map(file => file.path);
    }
    
    console.log("Item before save:", JSON.stringify(newItem, null, 2));
    
    const savedItem = await newItem.save();
    
    console.log("Item saved successfully:", savedItem._id);
    
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

// PUT/PATCH update item
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
    
    // Prepara i dati per l'aggiornamento
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      type: req.body.type,
      date: req.body.date
    };
    
    // MODIFICATO: Gestione semplificata della location
    let location = {
      address: item.location.address,
      city: item.location.city,
      state: item.location.state
    };
    
    // Parse della location in base al formato ricevuto
    if (req.body.location && typeof req.body.location === 'string') {
      try {
        const parsedLocation = JSON.parse(req.body.location);
        location = {
          address: parsedLocation.address || location.address,
          city: parsedLocation.city || location.city,
          state: parsedLocation.state || location.state
        };
      } catch (e) {
        console.error("Error parsing location JSON:", e);
      }
    } else if (req.body['location[address]'] || req.body['location[city]'] || req.body['location[state]']) {
      location = {
        address: req.body['location[address]'] || location.address,
        city: req.body['location[city]'] || location.city,
        state: req.body['location[state]'] || location.state
      };
    } else if (req.body.address || req.body.city || req.body.state) {
      location = {
        address: req.body.address || location.address,
        city: req.body.city || location.city,
        state: req.body.state || location.state
      };
    }
    
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
    
    // Aggiorna l'item
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
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
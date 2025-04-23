import express from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item.js';

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
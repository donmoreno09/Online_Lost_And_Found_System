import express from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item.js';

const router = express.Router();

// GET all items with optional filtering
router.get('/api/items', async (req, res) => {
  try {
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
    
    const items = await Item.find(filter)
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET a single item by ID
router.get('/api/items/:id', async (req, res) => {
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
router.post('/api/items', async (req, res) => {
  try {
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
    res.status(201).json({
      success: true,
      data: savedItem
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
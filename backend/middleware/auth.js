import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Check if Authorization header exists and is Bearer type
    if (!req.headers.authorization) return res.status(401).json({ message: 'Authentication required' });
    
    const parts = req.headers.authorization.split(' ');
    if (parts.length !== 2) return res.status(401).json({ message: 'Invalid token format' });
    if (parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid token format' });
    
    const token = parts[1];
    
    // Verify token signature
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
      // Error: token might have been tampered with
      if (err) return res.status(401).json({ message: 'Invalid token' });
      
      // Get user data from database
      const user = await User.findById(payload.id).select('-password');
      
      // User might have deleted account
      if (!user) return res.status(401).json({ message: 'User not found' });
      
      // Add user to request for subsequent middleware
      req.user = user;
      
      // Proceed to next middleware
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default auth;
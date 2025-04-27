import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  // Aggiungi il campo user all'inizio dello schema
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['electronics', 'jewelry', 'clothing', 'accessories', 'documents', 'other']
  },
  type: {
    type: String,
    required: [true, 'Please specify if the item is lost or found'],
    enum: ['lost', 'found']
  },
  date: {
    type: Date,
    default: Date.now
  },
  // MODIFICATA: Struttura della location semplificata
  location: {
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    }
  },
  images: [String],
  status: {
    type: String,
    enum: ['available', 'pending', 'claimed', 'rejected'],
    default: 'available'
  },
  
  claimant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  claimInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    message: String,
    date: {
      type: Date,
      default: Date.now
    }
  },
  claimStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  claimToken: {
    accept: String,
    reject: String,
    expiry: Date
  }
}, {
  timestamps: true
});

const Item = mongoose.model('Item', ItemSchema);
export default Item;

import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    type : {
        type: String,
        enum: ['lost', 'found'],
        required: true,
    },
    title : {
        type: String, 
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    category: {
        type: String,
        enum: ['electronics', 'jewelry', 'clothing', 'accessories', 'documents', 'other'],
        required: [true, 'Please provide a category'],
    },
    location: {
        type: {
            address: String,
            city: String,
            state: String,
            coordinate: {
                lat: Number,
                lng: Number
            }
        },
        required: [true, 'Please provide a location'],
    },
    date : {
        type: Date,
        default: Date.now,
    },
    images: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['open', 'claimed', 'resolved', 'expired'],
        default: 'open'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {timestamps : true});

const Item = mongoose.model('Item', itemSchema);

export default Item;

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true // trim è un metodo di mongoose che rimuove gli spazi bianchi all'inizio e alla fine della stringa
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: function() {
            // La password è obbligatoria solo se non c'è un googleId
            return this.googleId === null || this.googleId === undefined;
        },
        minlength: 6,
        select: false
    },
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null,
        match: [
            /^\+?[0-9]{1,4}?[-.\s]?(\()?[0-9]{1,3}(\))?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}$/,
            'Please provide a valid phone number'
        ]
    },
    googleId: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["User", "Admin"],
        default: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
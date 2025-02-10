// Define Book Request Schema
import mongoose from "mongoose";
const bookRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',  
        required: true
    },
    bookTitle: {
        type: String,  
        required: true
    },
    author: {
        type: String,
        required: true
    },
    isbn: {
        type: String,
        required: true
    },
    requestDate: {
        type: Date,
        default: Date.now  
    },
    status: {
        type: String,
        enum: ['Pending', 'Fulfilled', 'Rejected'], 
        default: 'Pending'
    },
    message: {
        type: String,
        default: ''  
    }
}, { timestamps: true });

// Create Model
export default mongoose.model("BookRequest", bookRequestSchema);
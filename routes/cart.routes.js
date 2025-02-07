import express from 'express';
import User from '../models/user.model.js';
import Book from '../models/book.model.js';
import authenticateToken from './userAuth.routes.js';

const router = express.Router();
router.put('/add-to-cart', authenticateToken, async (req, res) => {
    try {
        const { bookid, id, quantity } = req.headers;
        console.log("Quantity is:", quantity);

        if (!bookid) return res.status(400).json({ message: "Book ID is required" });
        if (!id) return res.status(400).json({ message: "User ID is required" });

        const userData = await User.findById(id);
        if (!userData) return res.status(404).json({ message: "User not found" });

        const book = await Book.findById(bookid);
        if (!book) return res.status(404).json({ message: "Book not found" });

        // Ensure quantity is valid
        const newQuantity = Number(quantity);
        if (isNaN(newQuantity) || newQuantity < 1) {
            return res.status(400).json({ message: "Invalid quantity" });
        }

        // Update book quantity in Books model
        book.quantity = newQuantity;
        await book.save();

        
        const isBookInCart = userData.cart.includes(bookid);
        if (isBookInCart) {
            return res.status(400).json({ message: "Book already in cart" });
        }

        // Add book to user's cart
        await User.findByIdAndUpdate(id, { $push: { cart: bookid } });

        return res.status(200).json({ message: "Book added to cart and quantity updated", book });
    } catch (error) {
        console.log("Error adding book to cart", error);
        res.status(500).json({ message: "An error occurred", error });
    }
});

router.put('/remove-from-cart/:bookid', authenticateToken, async (req, res) => {

    try {
        const { bookid } = req.params;
        const { id } = req.headers;
        await User.findByIdAndUpdate(id, { $pull: { cart: bookid } });
        return res.status(200).json({ message: 'Book removed to cart' });
    } catch (error) {
        console.log('Error removing book to cart', error);
        res.status(500).json(error);
    }
});



router.get('/get-cart-books', authenticateToken, async (req, res) => {

    try {
        const { id } = req.headers;
        const userData = await User.findById(id).populate("cart")
        const cart = userData.cart.reverse();//recently added to cart item will be on top of cart item
        return res.json({
            status: "success",
            data: cart,


        });
    } catch (error) {
        console.log('Error getting cart', error);
        return res.status(500).json(error);
    }
});



export default router;
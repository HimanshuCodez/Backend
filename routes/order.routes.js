import express from 'express';
import User from '../models/user.model.js';
import axios from 'axios'
import Order from '../models/order.model.js';
import authenticateToken from './userAuth.routes.js';
import stripe from "../stripe.js";
const router = express.Router();
//for users
router.post('/place-order', authenticateToken, async (req, res) => {
    try {
        const { session_id } = req.body;
        
        // ✅ Verify payment success
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ message: "Payment not successful" });
        }

        const userId = session.metadata.userId;
        const cartItemIds = JSON.parse(session.metadata.cartItems);
        let orderIds = [];

        // ✅ Create orders for each item
        for (const bookId of cartItemIds) {
            const newOrder = new Order({
                user: userId,
                book: bookId,
                status: 'Order Placed',
            });

            const orderDataFromdb = await newOrder.save();
            orderIds.push(orderDataFromdb._id);

            // ✅ Update user: Add order & remove from cart
            await User.findByIdAndUpdate(userId, {
                $push: { orders: orderDataFromdb._id },
                $pull: { cart: bookId }
            });
        }

        // ✅ Automatically send the invoice
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

       // ✅ Send invoices for each order
for (const orderId of orderIds) {
    try {
        const invoiceResponse = await axios.post(
            `${process.env.BACKEND_URL}/api/v1/send-invoice`,
            { order_id: orderId },
            { headers: { authorization: req.headers.authorization } }
        );
        console.log("✅ Invoice sent successfully:", invoiceResponse.data);
    } catch (error) {
        console.error(`❌ Failed to send invoice for order ${orderId}:`, error.response?.data || error.message);
    }
}

        res.status(200).json({ message: "Order placed successfully & Invoice Sent!" });

    } catch (error) {
        console.error("Error during order placement:", error);
        res.status(500).json({ message: "Place order error" });
    }
});


router.get('/get-order-history', authenticateToken, async (req, res) => {

    try {
        const { id } = req.headers;
        const userData = await User.findById(id).populate({
            path: "orders",
            populate: { path: "book" },
        })
        const ordersData = userData.orders.reverse();
        return res.json({
            status: "success",
            data: ordersData,
            message: "history books fetched successfully"

        });
    } catch (error) {
        console.log('Error getting history', error);
        return res.status(500).json(error);
    }
});

//for admin
router.get("/get-all-orders", authenticateToken, async (req, res) => {
    try {
        const userData = await Order.find().populate({ path: "book", }).populate({ path: "user", }).sort({ createdAt: -1 });
        return res.status(200).json({
            status: "success",
            data: userData,
            message: "All orders fetched successfully"
        })

    } catch (error) {
      console.log('Error getting all orders', error);
        return res.status(500).json(error);
    }
})
router.get("/update-status/:id", authenticateToken, async (req, res) => {
    try {
        const {id} = req.params;
         await Order.findByIdAndUpdate(id,{status:req.body.status})
        return res.status(200).json({
            status: "success",          
            message: " update status successfully"
        })

    } catch (error) {
      console.log('Error getting update orders', error);
        return res.status(500).json(error);
    }
})




export default router;
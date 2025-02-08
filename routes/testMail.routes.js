import express from 'express';
import nodemailer from 'nodemailer';
import authenticateToken from './userAuth.routes.js';
import User from '../models/user.model.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

router.post('/send-invoice', authenticateToken, async (req, res) => {
    try {
        const { order_id } = req.body;
        if (!order_id) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        const user = req.user;
        console.log("User ID:", user);

        const userData = await User.findById(user.id).populate({
            path: "orders",
            populate: { path: "book" },
        });

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const order = userData.orders.find(order => order._id.toString() === order_id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        console.log("Order Found:", order);
        console.log("Order Books:", order.book);

        if (!order.book || order.book.length === 0) {
            return res.status(400).json({ success: false, message: "No books found in this order" });
        }

        const orderDetailsHtml = order.book.map(book => `
            <tr style="border-bottom: 1px solid #ddd; text-align: left;">
                <td style="padding: 10px;">
                    <img src="${book.url}" alt="${book.name}" style="width: 50px; height: 70px; border-radius: 5px;">
                </td>
                <td style="padding: 10px;">${book.name}</td>
                <td style="padding: 10px;">${book.quantity}</td>
                <td style="padding: 10px;">₹${book.price}</td>
            </tr>
        `).join("");

        const mailOptions = {
            from: { name: 'Bookishhh Store', address: process.env.EMAIL_USER },
            to: user.email,
            subject: `Invoice for Order #${order._id}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; width: 80%; margin: auto;">
                    <h2 style="text-align: center; color: #4CAF50;">Bookishhh Store Invoice</h2>
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Customer Name:</strong> ${user.username}</p>
                    <p><strong>Email:</strong> ${user.email}</p>

                    <h3 style="border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Order Details</h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <tr style="background: #4CAF50; color: white;">
                            <th style="padding: 10px;">Image</th>
                            <th style="padding: 10px;">Book</th>
                            <th style="padding: 10px;">Quantity</th>
                            <th style="padding: 10px;">Price</th>
                        </tr>
                        ${orderDetailsHtml}
                    </table>

                  

                    <p style="text-align: center; color: #888;">Thank you for shopping with us!</p>
                    <div style="text-align: center;">
                        <img src="https://i.pinimg.com/originals/a1/5a/e3/a15ae34f897df2147a40ee4fddd0d60a.gif" alt="Thank You" style="width: 150px; height: auto;">
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'Invoice sent successfully',
            details: {
                messageId: info.messageId,
                response: info.response
            }
        });
    } catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({ success: false, message: 'Failed to send invoice', error: error.message });
    }
});

export default router;

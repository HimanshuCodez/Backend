import express from "express";
import Order from '../models/order.model.js'; // Import Order Model
import authenticateToken from "./userAuth.routes.js";


const router = express.Router();

// GET Sales Report
router.get("/sales-report", authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const totalInDB = await Order.countDocuments();
        const orders = await Order.find({
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }).populate("book user").limit(0);
        let totalOrders = totalInDB
        let totalRevenue = 0;
        let totalBooksSold = 0;
        let salesByBook = {};
        let monthlySales = {};




        orders.forEach(order => {
            const orderMonth = new Date(order.createdAt).toISOString(); // YYYY-MM

            if (!monthlySales[orderMonth]) {
                monthlySales[orderMonth] = { month: orderMonth, sales: 0 };
            }

            order.book.forEach(book => {
                if (order.status === "Delivered") {
                    totalBooksSold += 1; // Only count delivered books
                    totalRevenue += book.price;
                    monthlySales[orderMonth].sales += book.price;
                }

                if (!salesByBook[book.name]) {
                    salesByBook[book.name] = { count: 0, revenue: 0 };
                }
                salesByBook[book.name].count += 1;
                salesByBook[book.name].revenue += book.price;
            });
        });

        const topSellingBooks = Object.entries(salesByBook)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([name, data]) => ({ name, sales: data.count }));


        res.json({
            totalOrders,  // Shows all orders
            totalBooksSold,  // Only delivered books
            totalRevenue,
            monthlySales: Object.values(monthlySales),
            topSellingBooks,
            allOrders: orders, 
        });
    } catch (error) {
        console.error("Error fetching sales report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
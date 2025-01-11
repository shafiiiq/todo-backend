const express = require('express');
const cors = require('cors');
const pool = require('./db');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // To parse incoming JSON requests

// Retrieve users with purchases in the last 30 days
app.get('/api/users-last-30-days', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT u.userid, u.name, u.email
            FROM Users u
            JOIN Transactions t ON u.userid = t.userid
            WHERE t.date > CURRENT_DATE - INTERVAL '30 days'
        `);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No users found with purchases in the last 30 days' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Identify top 3 products by purchase frequency
app.get('/api/top-products', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.name, COUNT(td.productid) AS purchase_count
            FROM TransactionDetails td
            JOIN Products p ON td.productid = p.productid  -- Corrected to use 'productid'
            GROUP BY p.name
            ORDER BY purchase_count DESC
            LIMIT 3
        `);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No products found' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching top products:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Calculate revenue per product category
app.get('/api/revenue-per-category', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.category, SUM(p.price * td.quantity) AS total_revenue
            FROM TransactionDetails td
            JOIN Products p ON td.productid = p.productid  -- Corrected to use 'productid'
            GROUP BY p.category
        `);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No revenue data found' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching revenue data:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Create a function to calculate remaining stock
app.get('/api/remaining-stock/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const result = await pool.query(`
            SELECT stock - COALESCE(SUM(td.quantity), 0) AS remaining_stock
            FROM Products p
            LEFT JOIN TransactionDetails td ON p.productid = td.productid  -- Corrected to use 'productid'
            WHERE p.productid = $1
            GROUP BY p.productid
        `, [productId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: `Product with ID ${productId} not found` });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching remaining stock:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

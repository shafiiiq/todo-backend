require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL from the .env file
    ssl: {
        rejectUnauthorized: false // Enable SSL for connection to Render (required)
    }
});

// Test the connection
pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL on Render!");
        client.release();
    })
    .catch(err => {
        console.error("Error connecting to PostgreSQL:", err);
    });

module.exports = pool;

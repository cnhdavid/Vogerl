// db.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Function to create a PostgreSQL connection pool
function createPool() {
    try {
        // Read SSL certificate from the specified path
        const sslCert = fs.readFileSync(path.resolve(__dirname, process.env.PG_SSL_CERT_PATH)).toString();

        // Create a new pool instance
        const pool = new Pool({
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            user: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
            database: process.env.PG_DATABASE,
            ssl: {
                rejectUnauthorized: true,
                ca: sslCert
            },
            // Optional pool configuration settings
            // max: 10, // Maximum number of connections
            // idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            // connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        });

        return pool;
    } catch (error) {
        // Handle errors (e.g., file read errors, invalid path)
        console.error('Error creating PostgreSQL pool:', error);
        throw error;
    }
}

module.exports = { createPool };
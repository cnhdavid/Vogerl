require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const connectionString = process.env.DATABASE_URL;

// Singleton to hold the pool instance
let poolInstance = null;

// Function to create a PostgreSQL connection pool
function createPool() {
    
    const pool = new Pool({
        connectionString: connectionString
    });
    return pool;
}

// Function to execute a query using the pool
async function executeQuery(text, params) {
    const pool = createPool();
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
}

// Export the executeQuery function
module.exports = { executeQuery };
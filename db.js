require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const connectionString = process.env.DATABASE_URL;


// Function to create a PostgreSQL connection pool
function createPool() {
    
    const pool = new Pool({
        connectionString: connectionString
    });
    return pool;
}

module.exports = { createPool };
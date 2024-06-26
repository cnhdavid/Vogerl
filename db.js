require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const connectionString = process.env.DATABASE_URL;

// Singleton to hold the pool instance
let poolInstance = null;

// Function to create a PostgreSQL connection pool
function createPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: connectionString,
      max: 20, // Adjust the max number of clients in the pool
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Handle pool errors
    poolInstance.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      process.exit(-1);
    });
  }
  return poolInstance;
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
module.exports = { executeQuery, createPool };

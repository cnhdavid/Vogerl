require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authenticateToken = require('./authenticate');
const fs = require('fs');
const multer = require('multer');
const upload = multer();
const path = require('path');


const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});




// Check Cpnnection
app.get('/check-db-connection', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ success: true, message: 'Database connection is successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
    }
});

// User registration
app.post('/signup', async (req, res) => {
    const { username, email, password, date_of_birth, first_name, last_name } = req.body;
    console.log("tryinggg")
    const dob = new Date(date_of_birth);
    const formattedDOB = dob.toISOString().split('T')[0];
    console.log(formattedDOB)
    
    try {
        // Check if username or email already exists
        const userCheckQuery = 'SELECT * FROM users WHERE username = $1 OR email = $2';
        const userCheckResult = await pool.query(userCheckQuery, [username, email]);

        if (userCheckResult.rows.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const insertQuery = 'INSERT INTO users (username, email, password, date_of_birth, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const insertResult = await pool.query(insertQuery, [username, email, hashedPassword,formattedDOB , first_name, last_name]);

        res.status(201).json(insertResult.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        console.error('Error inserting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the email exists
        const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
        const userCheckResult = await pool.query(userCheckQuery, [email]);

        if (userCheckResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = userCheckResult.rows[0];

        // Compare the provided password with the hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate and store JWT secret key if not already present
        let jwtSecretKey = user.jwt_secret_key;
        if (!jwtSecretKey) {
            jwtSecretKey = crypto.randomBytes(64).toString('hex');
            const updateQuery = 'UPDATE users SET jwt_secret_key = $1 WHERE email = $2';
            await pool.query(updateQuery, [jwtSecretKey, email]);
        }

        const token = jwt.sign({ username: user.username }, jwtSecretKey, { expiresIn: '1h' });        
        res.json({ token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/post', authenticateToken, upload.single('image'), async (req, res) => {
    const { title, content, subject } = req.body;
    const username = req.user.username; // Extract username from the token
    let image = null;

    // If image is uploaded, convert it to Base64 string
    if (req.file) {
        image = req.file.buffer.toString('base64');
    }

    try {
        const result = await pool.query(
            'INSERT INTO posts (title, content, subject, username, image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, content, subject, username, image]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error inserting data into database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





app.get('/api/posts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching posts from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to get comments by post ID
async function getCommentsByPostId(postId) {
    const query = 'SELECT * FROM comments WHERE post_id = $1';
    const values = [postId];
    
    try {
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
}

// Function to get a post by ID
async function getPostById(postId) {
    const query = 'SELECT * FROM posts WHERE id = $1';
    const values = [postId];
    
    try {
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            console.error(`Post with ID ${postId} not found.`);
            return null;
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
    }
}
// Endpoint to get comments based on post ID
app.get('/api/posts/:postId/comments', async (req, res) => {
    const postId = req.params.postId;
    
    try {
        const comments = await getCommentsByPostId(postId);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching comments' });
    }
});

app.get('/api/posts/:postId', async (req, res) => {
    const postId = req.params.postId;
    
    try {
        const post = await getPostById(postId);
        if (post) {
            res.status(200).json(post);
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the post' });
    }
});

app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const { content, parentId } = req.body; // Include parentId in the request body
    const username = req.user.username; // Extract username from the token

    try {
        const result = await pool.query(
            `INSERT INTO comments (username, post_id, content, parent_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
            [username, postId, content, parentId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error inserting comment into database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

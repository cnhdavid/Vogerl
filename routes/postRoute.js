const express = require('express');
const router = express.Router();
const createPool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../authenticate');
const pool = createPool.createPool();
const multer = require('multer');
const upload = multer();

const { filterProfanity, containsProfanity } = require('../public/js/modules/moderate');

router.post('/create', authenticateToken, upload.single('image'), async(req, res) => {
    let { title, content, subject } = req.body;
    const username = req.user.username; // Extract username from the token
    let image = null;

    // If image is uploaded, convert it to Base64 string
    if (req.file) {
        image = req.file.buffer.toString('base64');
    }
    let modifiedTitle = await filterProfanity(title);
    const modifiedContent = await filterProfanity(content);
    const titleHasProfanity = await containsProfanity(title);
    const contentHasProfanity = await containsProfanity(content);

    if (titleHasProfanity || contentHasProfanity) {
        modifiedTitle += ' (The post content was changed due to it containing profanity)';

    }

    try {
        const client = await pool.connect();
        try {
            const insertQuery = 'INSERT INTO posts (username, title, content, subject, image) VALUES ($1, $2, $3, $4, $5)';
            await client.query(insertQuery, [username, modifiedTitle, modifiedContent, subject, image]);
            res.status(201).json({ message: 'Post created successfully' });
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/Deletepost/:postId', authenticateToken, async(req, res) => {
    const postId = req.params.postId;

    console.log(postId);

    const client = await pool.connect();
    try {
        // Check if the post exists and belongs to the authenticated user
        const postQuery = await client.query(
            'SELECT * FROM posts WHERE id = $1', [postId]
        );
        const post = postQuery.rows[0];
        if (!post) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        // Delete the post
        client.query(
            'DELETE FROM postvotes WHERE post_id = $1', [postId]
        );

        client.query(
            'DELETE FROM comments WHERE post_id = $1', [postId]
        );

        client.query(
            'DELETE FROM posts WHERE id = $1', [postId]
        );

        // Respond with success message
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});

router.get('/posts', async(req, res) => {

    let subject = req.query.subject;

    if (!subject) {
        subject = "All";
    }
    const username = req.query.username; // Get the username from query params



    try {
        const client = await pool.connect();
        try {
            let result;
            if (username) {

                if (subject === "All") {
                    result = await client.query('SELECT * FROM posts WHERE username = $1', [username]);
                } else {
                    result = await client.query('SELECT * FROM posts WHERE username = $1 AND subject = $2', [username, subject]);
                }
            } else if (subject && subject !== "All") {
                result = await client.query('SELECT * FROM posts WHERE subject = $1', [subject]);
            } else {
                result = await client.query('SELECT * FROM posts');
            }

            res.status(200).json(result.rows);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

router.put('/:postId', authenticateToken, async(req, res) => {
    const postId = req.params.postId;
    const username = req.user.username;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).send('Title and content are required');
    }
    let modifiedTitle = await filterProfanity(title);
    const modifiedContent = await filterProfanity(content);
    const titleHasProfanity = await containsProfanity(title);
    const contentHasProfanity = await containsProfanity(content);

    if (titleHasProfanity || contentHasProfanity) {
        modifiedTitle += ' (The post content was changed due to it containing profanity)';

    }

    try {
        const client = await pool.connect();
        try {
            await client.query('UPDATE posts SET title = $1, content = $2 WHERE id = $3 AND username = $4', [modifiedTitle, modifiedContent, postId, username]);
            res.status(200).json({ message: 'Post updated successfully' });
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:postId', async(req, res) => {
    const postId = req.params.postId;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
            const post = result.rows[0];
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            res.status(200).json(post);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router
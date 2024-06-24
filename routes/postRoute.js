const express = require('express');
const router = express.Router();
const createPool = require('../db');
const myCache = require('../cache');
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

            myCache.del('allPosts');
            res.status(201).json({ message: 'Post created successfully' });
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/Deletepost/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Start a transaction

        // Check if the post exists and belongs to the authenticated user
        const postQuery = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
        const post = postQuery.rows[0];

        if (!post) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        // Delete related data (e.g., votes and comments)
        await client.query('DELETE FROM postvotes WHERE post_id = $1', [postId]);
        await client.query('DELETE FROM comments WHERE post_id = $1', [postId]);

        // Delete the post itself
        await client.query('DELETE FROM posts WHERE id = $1', [postId]);

        await client.query('COMMIT'); // Commit the transaction

        // Invalidate cache
        myCache.del('allPosts');

        // Respond with success message
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});

router.get('/posts/:subject/:username', async(req, res) => {

    let subject = req.params.subject;


    if (!subject) {
        subject = "All";
    }
    const username = req.params.username; // Get the username from query params
    if (!username) {
        username = null;
    }
    console.log(username, subject);
    

    const cacheKey = `allPosts`;
    const cachedPosts = myCache.get(cacheKey);

    if (cachedPosts) {
        return res.status(200).json(cachedPosts);
    }

    try {
        let result;
        if (username) {

            if (subject === "All") {
                result = await pool.query('SELECT * FROM posts WHERE username = $1', [username]);
            } else {
                result = await pool.query('SELECT * FROM posts WHERE username = $1 AND subject = $2', [username, subject]);
            }
        } else if (subject && subject !== "All") {
            result = await pool.query('SELECT * FROM posts WHERE subject = $1', [subject]);
        } else {
            result = await pool.query('SELECT * FROM posts');
        }

        myCache.set(cacheKey, result.rows);
        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
            await client.query('UPDATE posts SET title = $1, content = $2 WHERE id = $3 AND username = $4', [modifiedTitle, modifiedContent, postId, username]);

            const myCacheKey = `allPosts`;
            myCache.del(myCacheKey);
            res.status(200).json({ message: 'Post updated successfully' });
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
     
});

router.get('/:postId', async(req, res) => {
    const postId = req.params.postId;
    console.log(postId);

    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
            const post = result.rows[0];
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            myCache.del(`allposts`);
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
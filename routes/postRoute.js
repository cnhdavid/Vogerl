const express = require('express');
const router = express.Router();
const createPool = require('../db');
const myCache = require('../cache');
const authenticateToken = require('../authenticate');
const pool = createPool.createPool();
const multer = require('multer');
const upload = multer();

const { filterProfanity, containsProfanity } = require('../public/js/modules/moderate');

router.post('/create', authenticateToken, upload.single('image'), async (req, res) => {
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
            res.formatResponse({ message: 'Post created successfully' }, 201);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error creating post:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
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
            return res.formatResponse({ error: 'Post not found or unauthorized' }, 404);
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
        res.formatResponse({ message: 'Post deleted successfully' }, 200);
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error deleting post:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    } finally {
        client.release(); // Release the client back to the pool
    }
});

router.get('/posts', async (req, res) => {
    let subject = req.query.subject || 'All';
    let username = req.query.username || null;
    console.log(subject)
    const cacheKey = `allPosts`;
    const cachedPosts = myCache.get(cacheKey);

    if (cachedPosts && subject === "All" && username === null) {
        console.log("returning from cache");
        // sort by date
        cachedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return res.formatResponse(cachedPosts, 200);
    }

    try {
        let result;
        if (username !== null) {
            if (subject === "All") {
                result = await pool.query('SELECT * FROM posts WHERE username = $1', [username]);
            } else {
                result = await pool.query('SELECT * FROM posts WHERE username = $1 AND subject = $2', [username, subject]);
            }
        } else if (subject && subject !== "All") {
            console.log(subject);
            result = await pool.query('SELECT * FROM posts WHERE subject = $1', [subject]);
        } else {
            console.log("updating cache");
            result = await pool.query('SELECT * FROM posts');
            result.rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            myCache.set(cacheKey, result.rows);
        }

        res.formatResponse(result.rows, 200);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

router.put('/:postId', authenticateToken, async (req, res) => {
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
            const myCacheKey = `allPosts`;
            myCache.del(myCacheKey);
            res.formatResponse({ message: 'Post updated successfully' }, 200);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error updating post:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

router.get('/:postId', async (req, res) => {
    const postId = req.params.postId;
    console.log(postId);

    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
            const post = result.rows[0];
            if (!post) {
                return res.formatResponse({ error: 'Post not found' }, 404);
            }
            myCache.del(`allposts`);
            res.formatResponse(post, 200);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

module.exports = router;
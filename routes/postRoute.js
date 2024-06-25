const express = require('express');
const router = express.Router();
const { executeQuery } = require('../db');
const myCache = require('../cache');
const authenticateToken = require('../authenticate');
const multer = require('multer');
const upload = multer();
const { filterProfanity, containsProfanity } = require('../public/js/modules/moderate');

/**
 * @route POST /create
 * @desc Create a new post
 * @param {string} title - The title of the post
 * @param {string} content - The content of the post
 * @param {string} subject - The subject of the post
 * @param {file} image - Optional image file uploaded with the post
 * @returns {object} message - Success or error message
 */
router.post('/create', authenticateToken, upload.single('image'), async (req, res) => {
    let { title, content, subject } = req.body;
    const username = req.user.username; // Extract username from the token
    let image = null;

    // If image is uploaded, convert it to Base64 string
    if (req.file) {
        image = req.file.buffer.toString('base64');
    }
    let modifiedTitle = await filterProfanity(title);
    let modifiedContent = await filterProfanity(content);
    const titleHasProfanity = await containsProfanity(title);
    const contentHasProfanity = await containsProfanity(content);

    if (titleHasProfanity || contentHasProfanity) {
        modifiedTitle += ' (The post content was changed due to it containing profanity)';
        modifiedContent += ' (The post content was changed due to it containing profanity)';
    }

    try {
        const insertQuery = 'INSERT INTO posts (username, title, content, subject, image) VALUES ($1, $2, $3, $4, $5)';
        await executeQuery(insertQuery, [username, modifiedTitle, modifiedContent, subject, image]);

        myCache.del('allPosts');
        res.formatResponse({ message: 'Post created successfully' }, 201);
    } catch (error) {
        console.error('Error creating post:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @route DELETE /Deletepost/:postId
 * @desc Delete a specific post
 * @param {string} postId - The ID of the post to delete
 * @returns {object} message - Success or error message
 */
router.delete('/Deletepost/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;

    try {
        await executeQuery('BEGIN'); // Start a transaction

        // Check if the post exists and belongs to the authenticated user
        const postQuery = await executeQuery('SELECT * FROM posts WHERE id = $1', [postId]);
        const post = postQuery.rows[0];

        if (!post) {
            return res.formatResponse({ error: 'Post not found or unauthorized' }, 404);
        }

        // Delete related data (e.g., votes and comments)
        await executeQuery('DELETE FROM postvotes WHERE post_id = $1', [postId]);
        await executeQuery('DELETE FROM comments WHERE post_id = $1', [postId]);

        // Delete the post itself
        await executeQuery('DELETE FROM posts WHERE id = $1', [postId]);

        await executeQuery('COMMIT'); // Commit the transaction

        // Invalidate cache
        myCache.del('allPosts');

        // Respond with success message
        res.formatResponse({ message: 'Post deleted successfully' }, 200);
    } catch (error) {
        await executeQuery('ROLLBACK'); // Rollback transaction on error
        console.error('Error deleting post:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @route GET /posts
 * @desc Fetch posts based on subject and/or username
 * @param {string} subject - Optional filter for posts by subject
 * @param {string} username - Optional filter for posts by username
 * @returns {array} posts - Array of posts matching the filters
 */
router.get('/posts', async (req, res) => {
    let subject = req.query.subject || 'All';
    let username = req.query.username || null;

    const cacheKey = `allPosts`;
    const cachedPosts = myCache.get(cacheKey);

    if (cachedPosts && subject === "All" && username === null) {
        // Return cached posts sorted by date
        cachedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return res.formatResponse(cachedPosts, 200);
    }

    try {
        let result;
        if (username !== null) {
            if (subject === "All") {
                result = await executeQuery('SELECT * FROM posts WHERE username = $1', [username]);
            } else {
                result = await executeQuery('SELECT * FROM posts WHERE username = $1 AND subject = $2', [username, subject]);
            }
        } else if (subject && subject !== "All") {
            result = await executeQuery('SELECT * FROM posts WHERE subject = $1', [subject]);
        } else {
            // Fetch all posts and cache them
            result = await executeQuery('SELECT * FROM posts');
            result.rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            myCache.set(cacheKey, result.rows);
        }

        res.formatResponse(result.rows, 200);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @route PATCH /:postId
 * @desc Update a specific post
 * @param {string} postId - The ID of the post to update
 * @returns {object} message - Success or error message
 */
router.patch('/:postId', authenticateToken, upload.none(), async (req, res) => {
    const { postId } = req.params;
    const { username } = req.user;  // Extracted from token in `authenticateToken` middleware
    const updates = req.body;

    // Prepare updates, checking for profanity and adjusting fields as necessary
    const fieldsToUpdate = {};
    if (updates.title) {
        let modifiedTitle = await filterProfanity(updates.title);
        if (await containsProfanity(updates.title)) {
            modifiedTitle += ' (Modified due to profanity)';
        }
        fieldsToUpdate.title = modifiedTitle;
    }
    if (updates.content) {
        let modifiedContent = await filterProfanity(updates.content);
        if (await containsProfanity(updates.content)) {
            modifiedContent += ' (Modified due to profanity)';
        }
        fieldsToUpdate.content = modifiedContent;
    }

    // Generate SQL based on fields provided
    const setClause = Object.keys(fieldsToUpdate)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
    const values = [...Object.values(fieldsToUpdate), postId, username];

    if (Object.keys(fieldsToUpdate).length > 0) {
        try {
            const queryText = `UPDATE posts SET ${setClause} WHERE id = $${Object.keys(fieldsToUpdate).length + 1} AND username = $${Object.keys(fieldsToUpdate).length + 2}`;
            await executeQuery(queryText, values);
            res.status(200).json({ message: 'Post updated successfully' });
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(400).json({ error: 'No valid fields provided for update' });
    }
});

/**
 * @route GET /:postId
 * @desc Fetch a specific post by ID
 * @param {string} postId - The ID of the post to fetch
 * @returns {object} post - The post object
 */
router.get('/:postId', async (req, res) => {
    const postId = req.params.postId;

    try {
        const result = await executeQuery('SELECT * FROM posts WHERE id = $1', [postId]);
        const post = result.rows[0];
        if (!post) {
            return res.formatResponse({ error: 'Post not found' }, 404);
        }
        myCache.del(`allposts`);
        res.status(200).json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

module.exports = router;

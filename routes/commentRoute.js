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

router.get('/:postId', async(req, res) => {
    const postId = req.params.postId;

    try {
        const client = await pool.connect();
        try {
            const commentsQuery = 'SELECT * FROM comments WHERE post_id = $1';
            const commentsResult = await client.query(commentsQuery, [postId]);
            const comments = commentsResult.rows;
            res.status(200).json(comments);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/:postId/create', authenticateToken, async(req, res) => {
    const { postId } = req.params;
    let { content, parentId } = req.body; // Include parentId in the request body
    const username = req.user.username; // Extract username from the token

    try {
        const client = await pool.connect();
        try {
            // Insert the comment into the database
            const contentHasProfanity = await containsProfanity(content);
            if (contentHasProfanity) {
                content = '***PROFANITY DETECTED***';
            }
            const result = await client.query(
                `INSERT INTO comments (username, post_id, content, parent_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`, [username, postId, content, parentId]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error inserting comment into database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Endpoint to Mark comment as answer
router.post('/:commentId/answer', authenticateToken, async(req, res) => {
    const commentId  = req.params;
    const postId  = req.body;
    console.log(commentId.commentId, postId.postId);
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('UPDATE comments SET isanswer = true WHERE id = $1 AND post_id = $2', [commentId.commentId, postId.postId]);
            try {
                await markPostAsAnswered(postId.postId);
            } catch (error) {
                console.error('Error marking post as answered:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Comment not found' });
            }
            return res.status(200).json({ message: 'Comment marked as answer' });
        }
         catch (error) {
            console.error('Error marking comment as answer:', error);
            return res.status(500).json({ message: 'Internal server error' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// Mark Post as Answered
async function markPostAsAnswered(postId) {
    console.log('Marking post as answered:', postId);
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('UPDATE posts SET isanswered = true WHERE id = $1', [postId]);
        // Process the result if needed
    } catch (error) {
        console.error('Error marking post as answered:', error);
        // Handle the error
    } finally {
        if (client) {
            client.release(); // Release the client back to the pool
        }
    }
}

// Delete Comment
router.delete('/:commentId', authenticateToken, async(req, res) => {
    const commentId = req.params.commentId;
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('DELETE FROM comments WHERE id = $1', [commentId]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Comment not found' });
            }
            return res.status(200).json({ message: 'Comment deleted successfully' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            return res.status(500).json({ message: 'Internal server error' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router
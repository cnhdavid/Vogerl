const express = require('express');
const router = express.Router();
const createPool = require('../db');
const authenticateToken = require('../authenticate');
const pool = createPool.createPool();

router.get('/:username', async(req, res) => {
    const username = req.params.username;
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

            res.status(200).json(result.rows[0].id);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:username/posts', async(req, res) => {
    const username = req.params.username;
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM posts WHERE username = $1', [username]);
            res.status(200).json(result.rows);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

})

router.get('/:postId/hasUserLiked/:userId', authenticateToken, async(req, res) => {
    const { postId } = req.params;
    const user_id = req.params.userId;


    try {
        const hasUserLiked = await hasUserVoted(postId, user_id);

        res.status(200).json({ postId, hasUserLiked });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

router.get('/userInfo/:username', async(req, res) => {
    const username = req.params.username;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

            res.status(200).json(result.rows[0]);
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

async function hasUserVoted(postId, userId) {


    try {
        const client = await pool.connect();
        try {
            // Query the PostVotes table to check if the user has voted on the post
            const voteResult = await pool.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                // User hasn't voted on the post
                return 'none';
            } else {
                // User has voted on the post, check the vote value
                const vote = voteResult.rows[0].vote;
                if (vote === 1) {
                    // User has upvoted the post
                    return 'upvote';
                } else if (vote === -1) {
                    // User has downvoted the post
                    return 'downvote';
                } else {
                    // Invalid vote value
                    throw new Error('Invalid vote value');
                }
            }
        } catch (error) {
            console.error('Error checking if user has voted on post:', error);
            // Handle the error as needed
            throw new Error('Error checking if user has voted on post');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw new Error('Internal Server Error');
    }

}

module.exports = router
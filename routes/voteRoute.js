const express = require('express');
const router = express.Router();
const createPool = require('../db');
const authenticateToken = require('../authenticate');
const pool = createPool.createPool();

router.post('/:postId/upvote', authenticateToken, async(req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        const client = await pool.connect();
        try {
            // Find user ID by username
            const userResult = await client.query('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userId = userResult.rows[0].id;

            // Check if the user has already voted on this post
            const voteResult = await client.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                // User hasn't voted on this post yet, insert a new upvote
                await client.query('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, 1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === -1) {
                    // User has downvoted, update to upvote
                    await client.query('UPDATE PostVotes SET vote = 1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
                // If the user has already upvoted, do nothing or handle it as needed
            }

            res.status(200).json({ message: 'Post upvoted successfully' });
        } catch (error) {
            console.error('Error upvoting post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/:postId/downvote', authenticateToken, async(req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        const client = await pool.connect();
        try {
            // Find user ID by username
            const userResult = await client.query('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userId = userResult.rows[0].id;

            // Check if the user has already voted on this post
            const voteResult = await client.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                // User hasn't voted on this post yet, insert a new downvote
                await client.query('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, -1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === 1) {
                    // User has downvoted, update to upvote
                    await client.query('UPDATE PostVotes SET vote = -1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
                // If the user has already downvoted, do nothing or handle it as needed
            }

            res.status(200).json({ message: 'Post Downvoted successfully' });
        } catch (error) {
            console.error('Error upvoting post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:postId/votes', async(req, res) => {
    const { postId } = req.params;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT COALESCE(SUM(vote), 0) AS total_votes FROM PostVotes WHERE post_id = $1', [postId]);
            const totalVotes = result.rows[0].total_votes;
            res.status(200).json({ totalVotes });
        } catch (error) {
            console.error('Error fetching votes:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router
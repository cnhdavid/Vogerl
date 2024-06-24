const express = require('express');
const router = express.Router();
const createPool = require('../db'); // Assuming you have a pool configuration in db.js
const authenticateToken = require('../authenticate');
const myCache = require('../cache');

const pool = createPool.createPool();

router.post('/:postId/upvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        console.log('connecting to database');
        try {
            await pool.query('BEGIN'); // Start transaction

            // Find user ID by username
            const userResult = await pool.query('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userId = userResult.rows[0].id;

            // Check if the user has already voted on this post
            const voteResult = await pool.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                // User hasn't voted on this post yet, insert a new upvote
                await pool.query('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, 1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === -1) {
                    // User has downvoted, update to upvote
                    await pool.query('UPDATE PostVotes SET vote = 1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
                // If the user has already upvoted, do nothing or handle it as needed
            }

            await pool.query('COMMIT'); // Commit transaction

            const cacheKey = `post-${postId}-votes`;
            myCache.del(cacheKey); // Invalidate cache

            res.status(200).json({ message: 'Post upvoted successfully' });
        } catch (error) {
            await pool.query('ROLLBACK'); // Rollback transaction on error
            console.error('Error upvoting post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/:postId/downvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

        try {
            await pool.query('BEGIN'); // Start transaction

            // Find user ID by username
            const userResult = await pool.query('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userId = userResult.rows[0].id;

            // Check if the user has already voted on this post
            const voteResult = await pool.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                // User hasn't voted on this post yet, insert a new downvote
                await pool.query('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, -1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === 1) {
                    // User has upvoted, update to downvote
                    await pool.query('UPDATE PostVotes SET vote = -1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
                // If the user has already downvoted, do nothing or handle it as needed
            }

            await pool.query('COMMIT'); // Commit transaction

            const cacheKey = `post-${postId}-votes`;
            myCache.del(cacheKey); // Invalidate cache

            res.status(200).json({ message: 'Post downvoted successfully' });
        } catch (error) {
            await pool.query('ROLLBACK'); // Rollback transaction on error
            console.error('Error downvoting post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
});

router.get('/:postId/votes', async (req, res) => {
    const { postId } = req.params;
    const cacheKey = `post-${postId}-votes`;
    const cachedVotes = myCache.get(cacheKey);

    if (cachedVotes !== undefined) {
        return res.status(200).json({ totalVotes: cachedVotes });
    }

    
        try {
            const result = await pool.query('SELECT COALESCE(SUM(vote), 0) AS total_votes FROM PostVotes WHERE post_id = $1', [postId]);
            const totalVotes = result.rows[0].total_votes;

            myCache.set(cacheKey, totalVotes, 60 * 60 * 24); // Cache for 24 hours
            res.status(200).json({ totalVotes });
        } catch (error) {
            console.error('Error fetching votes:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } 
);

module.exports = router;
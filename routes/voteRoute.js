const express = require('express');
const router = express.Router();
const createPool = require('../db');
const authenticateToken = require('../authenticate');
const myCache = require('../cache');

const pool = createPool.createPool();

router.post('/:postId/upvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        try {
            await pool.query('BEGIN'); // Start transaction

            const userResult = await pool.query('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.formatResponse({ error: 'User not found' }, 404);
            }
            const userId = userResult.rows[0].id;

            const voteResult = await pool.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                await pool.query('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, 1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === -1) {
                    await pool.query('UPDATE PostVotes SET vote = 1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
            }

            await pool.query('COMMIT'); // Commit transaction

            const cacheKey = `post-${postId}-votes`;
            myCache.del(cacheKey); // Invalidate cache

            res.formatResponse({ message: 'Post upvoted successfully' }, 200);
        } catch (error) {
            await pool.query('ROLLBACK'); // Rollback transaction on error
            console.error('Error upvoting post:', error);
            res.formatResponse({ error: 'Internal Server Error' }, 500);
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

router.post('/:postId/downvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        try {
            await pool.query('BEGIN'); // Start transaction

            const userResult = await pool.query('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.formatResponse({ error: 'User not found' }, 404);
            }
            const userId = userResult.rows[0].id;

            const voteResult = await pool.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                await pool.query('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, -1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === 1) {
                    await pool.query('UPDATE PostVotes SET vote = -1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
            }

            await pool.query('COMMIT'); // Commit transaction

            const cacheKey = `post-${postId}-votes`;
            myCache.del(cacheKey); // Invalidate cache

            res.formatResponse({ message: 'Post downvoted successfully' }, 200);
        } catch (error) {
            await pool.query('ROLLBACK'); // Rollback transaction on error
            console.error('Error downvoting post:', error);
            res.formatResponse({ error: 'Internal Server Error' }, 500);
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

router.get('/:postId/votes', async (req, res) => {
    const { postId } = req.params;
    const cacheKey = `post-${postId}-votes`;
    const cachedVotes = myCache.get(cacheKey);

    if (cachedVotes !== undefined) {
        return res.formatResponse({ totalVotes: cachedVotes }, 200);
    }

    try {
        const result = await pool.query('SELECT COALESCE(SUM(vote), 0) AS total_votes FROM PostVotes WHERE post_id = $1', [postId]);
        const totalVotes = result.rows[0].total_votes;

        myCache.set(cacheKey, totalVotes, 60 * 60 * 24); // Cache for 24 hours
        res.formatResponse({ totalVotes }, 200);
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

module.exports = router;

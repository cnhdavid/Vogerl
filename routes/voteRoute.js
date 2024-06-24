const express = require('express');
const router = express.Router();
const { executeQuery } = require('../db');
const authenticateToken = require('../authenticate');
const myCache = require('../cache');


router.post('/:postId/upvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        try {
            await executeQuery('BEGIN'); // Start transaction

            const userResult = await executeQuery('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.formatResponse({ error: 'User not found' }, 404);
            }
            const userId = userResult.rows[0].id;

            const voteResult = await executeQuery('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                await executeQuery('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, 1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === -1) {
                    await executeQuery('UPDATE PostVotes SET vote = 1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
            }

            await executeQuery('COMMIT'); // Commit transaction

            const cacheKey = `allPosts`;
            myCache.del(cacheKey); // Invalidate cache

            res.formatResponse({ message: 'Post upvoted successfully' }, 200);
        } catch (error) {
            await executeQuery('ROLLBACK'); // Rollback transaction on error
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
            await executeQuery('BEGIN'); // Start transaction

            const userResult = await executeQuery('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.formatResponse({ error: 'User not found' }, 404);
            }
            const userId = userResult.rows[0].id;

            const voteResult = await executeQuery('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                await executeQuery('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, -1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === 1) {
                    await executeQuery('UPDATE PostVotes SET vote = -1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
            }

            await executeQuery('COMMIT'); // Commit transaction

            const cacheKey = `allPosts`;
            myCache.del(cacheKey); // Invalidate cache

            res.formatResponse({ message: 'Post downvoted successfully' }, 200);
        } catch (error) {
            await executeQuery('ROLLBACK'); // Rollback transaction on error
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
    

    try {
        const result = await executeQuery('SELECT COALESCE(SUM(vote), 0) AS total_votes FROM PostVotes WHERE post_id = $1', [postId]);
        const totalVotes = result.rows[0].total_votes;

        
        res.formatResponse({ totalVotes }, 200);
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

module.exports = router;

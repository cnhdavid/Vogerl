const express = require('express');
const router = express.Router();
const { executeQuery } = require('../db');
const authenticateToken = require('../authenticate');
const myCache = require('../cache');
const jwt = require('jsonwebtoken');

/**
 * @route POST /:postId/upvote
 * @desc Upvote a post
 * @param {string} postId - The ID of the post to upvote
 * @returns {object} message - Success message if upvote is successful
 */
router.post('/:postId/upvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        await executeQuery('BEGIN'); // Start transaction

        // Get user ID from username
        const userResult = await executeQuery('SELECT id FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.formatResponse({ error: 'User not found' }, 404);
        }
        const userId = userResult.rows[0].id;

        // Check if user has already voted on this post
        const voteResult = await executeQuery('SELECT * FROM postvotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

        if (voteResult.rows.length === 0) {
            // Insert new upvote
            await executeQuery('INSERT INTO postvotes (post_id, user_id, vote) VALUES ($1, $2, 1)', [postId, userId]);
        } else {
            // Update vote if user has already voted
            const currentVote = voteResult.rows[0].vote;
            if (currentVote === -1) {
                await executeQuery('UPDATE postvotes SET vote = 1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
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
});

/**
 * @route POST /:postId/downvote
 * @desc Downvote a post
 * @param {string} postId - The ID of the post to downvote
 * @returns {object} message - Success message if downvote is successful
 */
router.post('/:postId/downvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        await executeQuery('BEGIN'); // Start transaction

        // Get user ID from username
        const userResult = await executeQuery('SELECT id FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.formatResponse({ error: 'User not found' }, 404);
        }
        const userId = userResult.rows[0].id;

        // Check if user has already voted on this post
        const voteResult = await executeQuery('SELECT * FROM postvotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

        if (voteResult.rows.length === 0) {
            // Insert new downvote
            await executeQuery('INSERT INTO postvotes (post_id, user_id, vote) VALUES ($1, $2, -1)', [postId, userId]);
        } else {
            // Update vote if user has already voted
            const currentVote = voteResult.rows[0].vote;
            if (currentVote === 1) {
                await executeQuery('UPDATE postvotes SET vote = -1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
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
});

/**
 * @route GET /:postId/votes
 * @desc Get total votes for a post
 * @param {string} postId - The ID of the post to get votes for
 * @returns {object} totalVotes - Total number of votes for the post
 */
router.get('/:postId/votes', async (req, res) => {
    const { postId } = req.params;

    try {
        // Get total votes for the post
        const result = await executeQuery('SELECT COALESCE(SUM(vote), 0) AS total_votes FROM postvotes WHERE post_id = $1', [postId]);
        const totalVotes = result.rows[0].total_votes;

        res.formatResponse({ totalVotes }, 200);
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @route POST /votes
 * @desc Get votes for multiple posts
 * @param {array} postIds - Array of post IDs to get votes for
 * @returns {object} votes - Object containing post IDs as keys and total votes as values
 */
router.post('/votes', async (req, res) => {
    const { postIds } = req.body;  // Expecting an array of postIds in the request body

    if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.formatResponse({ error: 'Invalid input' }, 400);
    }

    try {
        // Create a query with multiple postIds
        const query = `
            SELECT post_id, COALESCE(SUM(vote), 0) AS total_votes 
            FROM PostVotes 
            WHERE post_id = ANY($1::int[]) 
            GROUP BY post_id
        `;
        const result = await executeQuery(query, [postIds]);

        // Map the results to an object for easier lookup on the frontend
        const votes = result.rows.reduce((acc, row) => {
            acc[row.post_id] = row.total_votes;
            return acc;
        }, {});

        res.formatResponse({ votes }, 200);
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @route POST /userVotes
 * @desc Get votes by a user for multiple posts
 * @param {array} postIds - Array of post IDs to get user votes for
 * @returns {object} userVotes - Object containing post IDs as keys and user's vote (1 for upvote, -1 for downvote) as values
 */
router.post('/userVotes', async (req, res) => {
    const { postIds } = req.body; // Expecting an array of postIds in the request body
    const token = req.headers.authorization.split(' ')[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const query = `
            SELECT post_id, vote
            FROM PostVotes
            WHERE post_id = ANY($1::int[]) AND user_id = $2
        `;
        const result = await executeQuery(query, [postIds, userId]);

        // Map the results to an object for easier lookup on the frontend
        const userVotes = result.rows.reduce((acc, row) => {
            acc[row.post_id] = row.vote;
            return acc;
        }, {});

        res.status(200).json({ userVotes });
    } catch (error) {
        console.error('Error fetching user votes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

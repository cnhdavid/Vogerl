const express = require('express');
const router = express.Router();
const { executeQuery } = require('../db');
const authenticateToken = require('../authenticate');


router.get('/:username', async (req, res) => {
    const username = req.params.username;
    
        
        try {
            const result = await executeQuery('SELECT * FROM users WHERE username = $1', [username]);
            res.formatResponse(result.rows[0].id, 200);
        }  catch (error) {
        console.error('Error fetching user:', error);
        res.formatResponse({ message: 'Internal server error' }, 500);
    }
});

router.get('/:username/posts', async (req, res) => {
    const username = req.params.username;
    
        try {
            const result = await executeQuery('SELECT * FROM posts WHERE username = $1', [username]);
            res.formatResponse(result.rows, 200);
        }  catch (error) {
        console.error('Error fetching posts:', error);
        res.formatResponse({ error: 'Internal Server Error' }, 500);
    }
});

router.get('/:postId/hasUserLiked/:userId', authenticateToken, async (req, res) => {
    const { postId, userId } = req.params;

    try {
        const hasUserLiked = await hasUserVoted(postId, userId);
        res.formatResponse({ postId, hasUserLiked }, 200);
    } catch (error) {
        res.formatResponse({ error: error.message }, 500);
    }
});

router.get('/userInfo/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const result = await executeQuery('SELECT * FROM users WHERE username = $1', [username]);
        res.formatResponse(result.rows[0], 200);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.formatResponse({ message: 'Internal server error' }, 500);
    }
});

async function hasUserVoted(postId, userId) {
    try {
        const voteResult = await executeQuery('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

        if (voteResult.rows.length === 0) {
            return 'none';
        } else {
            const vote = voteResult.rows[0].vote;
            if (vote === 1) {
                return 'upvote';
            } else if (vote === -1) {
                return 'downvote';
            } else {
                throw new Error('Invalid vote value');
            }
        }
    } catch (error) {
        console.error('Error checking if user has voted on post:', error);
        throw new Error('Error checking if user has voted on post');
    }
}

router.get('/:username/profile', async (req, res) => {
    const username = req.params.username;
    try {
        const result = await executeQuery('SELECT * FROM users WHERE username = $1', [username]);
        res.formatResponse(result.rows[0], 200);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.formatResponse({ message: 'Internal server error' }, 500);
    }
});

module.exports = router;
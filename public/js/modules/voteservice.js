const { pool } = require('./db'); // Ensure you have your database pool properly set up

async function getPostVotes(postId) {
    try {
        const result = await pool.query(
            `SELECT 
                COALESCE(SUM(vote), 0) AS total_votes 
             FROM 
                postvotes 
             WHERE 
                post_id = $1`, 
            [postId]
        );

        console.log('Result:', result.rows[0].total_votes);
        return result.rows[0].total_votes;
    } catch (error) {
        console.error('Error fetching votes for post:', error);
        throw new Error('Internal Server Error');
    }
}
 async function hasUserVoted(postId, userId) {
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
    }
}


// Example usage


module.exports = { getPostVotes, hasUserVoted };

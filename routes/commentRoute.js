const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");
const authenticateToken = require("../authenticate");

const myCache = require("../cache");

const { containsProfanity } = require("../public/js/modules/moderate");

/**
 * @route GET /:postId
 * @desc Fetch comments for a specific post, using cache if available
 * @param {string} postId - The ID of the post to fetch comments for
 * @returns {object} comments - Array of comments for the specified post
 */
router.get("/:postId", async (req, res) => {
  const postId = req.params.postId;
  const cacheKey = `comments_${postId}`;
  const cachedComments = myCache.get(postId);

  if (cachedComments) {
    return res.formatResponse(cachedComments, 200);
  }

  try {
    const commentsQuery = "SELECT * FROM comments WHERE post_id = $1";
    const commentsResult = await executeQuery(commentsQuery, [postId]);
    const comments = commentsResult.rows;

    myCache.set(cacheKey, comments);
    res.formatResponse(comments, 200);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.formatResponse({ error: "Internal Server Error" }, 500);
  }
});

/**
 * @route POST /commentCounts
 * @desc Fetch comment counts for multiple posts
 * @param {array} postIds - Array of post IDs to fetch comment counts for
 * @returns {object} commentCounts - Object with post IDs as keys and comment counts as values
 */
router.post('/commentCounts', async (req, res) => {
    const { postIds } = req.body; // Expecting an array of postIds in the request body

    if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const query = `
            SELECT post_id, COUNT(*) AS comment_count
            FROM comments
            WHERE post_id = ANY($1::int[])
            GROUP BY post_id
        `;
        const result = await executeQuery(query, [postIds]);

        // Map the results to an object for easier lookup on the frontend
        const commentCounts = result.rows.reduce((acc, row) => {
            acc[row.post_id] = parseInt(row.comment_count, 10);
            return acc;
        }, {});

        res.status(200).json({ commentCounts });
    } catch (error) {
        console.error('Error fetching comment counts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @route POST /:postId/create
 * @desc Create a new comment for a specific post
 * @param {string} postId - The ID of the post to add a comment to
 * @param {string} content - The content of the comment
 * @param {string} parentId - Optional parent ID if the comment is a reply
 * @param {string} username - The username of the user adding the comment (extracted from token)
 * @returns {object} comment - The created comment
 */
router.post("/:postId/create", authenticateToken, async (req, res) => {
  const { postId } = req.params;
  let { content, parentId } = req.body; // Include parentId in the request body
  const username = req.user.username; // Extract username from the token

  try {
    // Insert the comment into the database
    const contentHasProfanity = await containsProfanity(content);
    if (contentHasProfanity) {
      content = "***PROFANITY DETECTED***";
    }
    const result = await executeQuery(
      `INSERT INTO comments (username, post_id, content, parent_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [username, postId, content, parentId]
    );
    const myCacheKey = `comments_${postId}`;
    myCache.del(myCacheKey);
    res.formatResponse(result.rows[0], 201);
  } catch (error) {
    console.error("Error connecting to database:", error);
    res.formatResponse({ error: "Internal Server Error" }, 500);
  }
});

/**
 * @route POST /:commentId/answer
 * @desc Mark a comment as the answer for a specific post
 * @param {string} commentId - The ID of the comment to mark as the answer
 * @param {string} postId - The ID of the post to which the comment belongs
 * @returns {object} message - Success or error message
 */
router.post("/:commentId/answer", authenticateToken, async (req, res) => {
  const commentId = req.params;
  const postId = req.body;
  console.log(commentId.commentId, postId.postId);

  try {
    const result = await executeQuery(
      "UPDATE comments SET isanswer = true WHERE id = $1 AND post_id = $2",
      [commentId.commentId, postId.postId]
    );
    try {
      await markPostAsAnswered(postId.postId);
    } catch (error) {
      console.error("Error marking post as answered:", error);
      return res.formatResponse({ message: "Internal server error" }, 500);
    }

    if (result.rowCount === 0) {
      return res.formatResponse({ message: "Comment not found" }, 404);
    }
    return res.formatResponse({ message: "Comment marked as answer" }, 200);
  } catch (error) {
    console.error("Error connecting to database:", error);
    return res.formatResponse({ message: "Internal server error" }, 500);
  }
});

/**
 * Marks a post as answered by updating its status in the database
 * @param {string} postId - The ID of the post to mark as answered
 */
async function markPostAsAnswered(postId) {
  console.log("Marking post as answered:", postId);
  let client;
  try {
    const result = await executeQuery(
      "UPDATE posts SET isanswered = true WHERE id = $1",
      [postId]
    );
    // Process the result if needed
  } catch (error) {
    console.error("Error marking post as answered:", error);
    // Handle the error
  }
}

/**
 * @route DELETE /:commentId
 * @desc Delete a specific comment
 * @param {string} commentId - The ID of the comment to delete
 * @returns {object} message - Success or error message
 */
router.delete("/:commentId", authenticateToken, async (req, res) => {
  const commentId = req.params.commentId;

  try {
    const result = await executeQuery("DELETE FROM comments WHERE id = $1", [
      commentId,
    ]);
    if (result.rowCount === 0) {
      return res.formatResponse({ message: "Comment not found" }, 404);
    }
    return res.formatResponse({ message: "Comment deleted successfully" }, 200);
  } catch (error) {
    console.error("Error connecting to database:", error);
    return res.formatResponse({ message: "Internal server error" }, 500);
  }
});

module.exports = router;

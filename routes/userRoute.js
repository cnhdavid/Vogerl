const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");
const authenticateToken = require("../authenticate");

/**
 * @route GET /:username
 * @desc Fetch user information by username
 * @param {string} username - The username of the user to fetch
 * @returns {object} user - The user object
 */
router.get("/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const result = await executeQuery(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    res.formatResponse(result.rows[0].id, 200); // Assuming formatResponse is defined elsewhere to format the response
  } catch (error) {
    console.error("Error fetching user:", error);
    res.formatResponse({ message: "Internal server error" }, 500);
  }
});

/**
 * @route GET /:username/posts
 * @desc Fetch posts by a specific user
 * @param {string} username - The username of the user whose posts to fetch
 * @returns {array} posts - Array of posts by the user
 */
router.get("/:username/posts", async (req, res) => {
  const username = req.params.username;

  try {
    const result = await executeQuery(
      "SELECT * FROM posts WHERE username = $1",
      [username]
    );
    res.formatResponse(result.rows, 200); // Assuming formatResponse is defined elsewhere to format the response
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.formatResponse({ error: "Internal Server Error" }, 500);
  }
});

/**
 * @route GET /:postId/hasUserLiked/:userId
 * @desc Check if a user has liked a post
 * @param {string} postId - The ID of the post
 * @param {string} userId - The ID of the user
 * @returns {object} { postId, hasUserLiked } - Object indicating if user has liked the post
 */
router.get("/:postId/hasUserLiked/:userId", authenticateToken, async (req, res) => {
  const { postId, userId } = req.params;

  try {
    const hasUserLiked = await hasUserVoted(postId, userId);
    res.formatResponse({ postId, hasUserLiked }, 200); // Assuming formatResponse is defined elsewhere to format the response
  } catch (error) {
    res.formatResponse({ error: error.message }, 500); // Assuming formatResponse is defined elsewhere to format the response
  }
});

/**
 * @route GET /userInfo/:username
 * @desc Fetch user information by username
 * @param {string} username - The username of the user to fetch
 * @returns {object} user - The user object
 */
router.get("/userInfo/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const result = await executeQuery(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    res.formatResponse(result.rows[0], 200); // Assuming formatResponse is defined elsewhere to format the response
  } catch (error) {
    console.error("Error fetching user:", error);
    res.formatResponse({ message: "Internal server error" }, 500);
  }
});

/**
 * Helper function to check if a user has voted on a post
 * @param {string} postId - The ID of the post
 * @param {string} userId - The ID of the user
 * @returns {string} "upvote", "downvote", or "none" indicating the user's vote status
 * @throws {Error} Throws an error if there's an issue with database query or invalid vote value
 */
async function hasUserVoted(postId, userId) {
  try {
    const voteResult = await executeQuery(
      "SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );

    if (voteResult.rows.length === 0) {
      return "none";
    } else {
      const vote = voteResult.rows[0].vote;
      if (vote === 1) {
        return "upvote";
      } else if (vote === -1) {
        return "downvote";
      } else {
        throw new Error("Invalid vote value");
      }
    }
  } catch (error) {
    console.error("Error checking if user has voted on post:", error);
    throw new Error("Error checking if user has voted on post");
  }
}

/**
 * @route GET /:username/profile
 * @desc Fetch user profile information by username
 * @param {string} username - The username of the user to fetch profile information
 * @returns {object} user - The user profile object
 */
router.get("/:username/profile", async (req, res) => {
  const username = req.params.username;
  try {
    const result = await executeQuery(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    res.formatResponse(result.rows[0], 200); // Assuming formatResponse is defined elsewhere to format the response
  } catch (error) {
    console.error("Error fetching user:", error);
    res.formatResponse({ message: "Internal server error" }, 500);
  }
});

module.exports = router;

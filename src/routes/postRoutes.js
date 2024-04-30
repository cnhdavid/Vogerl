const express = require('express'); // Importing express
const router = express.Router(); // Creating a router instance
const postController = require('../controllers/postController'); // Importing post controller

// Get all posts
router.get('/', postController.getAllPosts); // Route to get all posts

// Create a new post
router.post('/', postController.createPost); // Route to create a new post

// Get a single post
router.get('/:postId', postController.getPost); // Route to get a single post

// Update a post
router.put('/:postId', postController.updatePost); // Route to update a post

// Delete a post
router.delete('/:postId', postController.deletePost); // Route to delete a post

module.exports = router; // Exporting the router

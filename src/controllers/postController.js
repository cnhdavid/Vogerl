// Import the Post model from the models directory
const Post = require('../models/postModel');

// Function to retrieve all posts from the database
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.findAll(); // Fetch all posts using Sequelize's findAll method
        res.status(200).json(posts); // Send a 200 OK response along with the retrieved posts in JSON format
    } catch (error) {
        res.status(500).json({ message: error.message }); // If an error occurs, send a 500 Internal Server Error response
    }
};

// Function to create a new post in the database
exports.createPost = async (req, res) => {
    const { title, content } = req.body; // Destructure title and content from the request body
    try {
        const newPost = await Post.create({
            title,
            content
        }); // Create a new post record in the database with the provided title and content
        res.status(201).json(newPost); // Send a 201 Created response along with the newly created post in JSON format
    } catch (error) {
        res.status(500).json({ message: error.message }); // If an error occurs, send a 500 Internal Server Error response
    }
};

// Function to retrieve a single post by its primary key (ID)
exports.getPost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.postId); // Find a post by its primary key using Sequelize's findByPk method
        if (!post) {
            return res.status(404).send('Post not found'); // If no post is found, send a 404 Not Found response
        }
        res.status(200).json(post); // Send a 200 OK response along with the retrieved post in JSON format
    } catch (error) {
        res.status(500).json({ message: error.message }); // If an error occurs, send a 500 Internal Server Error response
    }
};

// Function to update an existing post
exports.updatePost = async (req, res) => {
    try {
        const updated = await Post.update(req.body, { where: { id: req.params.postId } }); // Update the post with new data from the request body
        if (updated) {
            res.status(200).send('Post updated'); // If the update is successful, send a 200 OK response
        } else {
            res.status(404).send('Post not found'); // If no post is found for updating, send a 404 Not Found response
        }
    } catch (error) {
        res.status(500).json({ message: error.message }); // If an error occurs, send a 500 Internal Server Error response
    }
};

// Function to delete a post
exports.deletePost = async (req, res) => {
    try {
        const deleted = await Post.destroy({ where: { id: req.params.postId } }); // Delete the post from the database
        if (deleted) {
            res.status(200).send('Post deleted'); // If the delete operation is successful, send a 200 OK response
        } else {
            res.status(404).send('Post not found'); // If no post is found for deletion, send a 404 Not Found response
        }
    } catch (error) {
        res.status(500).json({ message: error.message }); // If an error occurs, send a 500 Internal Server Error response
    }
};

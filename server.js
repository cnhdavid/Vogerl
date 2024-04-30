// Load environment variables
require('dotenv').config();

const express = require('express'); // Importing express
const session = require('express-session'); // Importing express-session
const sequelize = require('./src/config/db'); // Importing sequelize instance
const User = require('./src/models/userModel'); // Importing User model
const Post = require('./src/models/postModel'); // Importing Post model
const userRoutes = require('./src/routes/userRoutes'); // Importing user routes
const postRoutes = require('./src/routes/postRoutes'); // Importing post routes
const cors = require('cors'); // Importing CORS
const morgan = require('morgan'); // Importing morgan for logging

const app = express(); // Creating express app
const PORT = process.env.PORT || 3000; // Setting port

// Middleware for logging
app.use(morgan('dev'));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET, // Ensure you have SESSION_SECRET in your .env file
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

// Middleware to serve static files
app.use(express.static('public'));

// API routes
app.use('/api/users', userRoutes); // Using user routes
app.use('/api/posts', postRoutes); // Using post routes

// Sync all defined models to the database
sequelize.sync().then(() => {
    console.log('Models are synchronized');
    // Start the server only after the models are synchronized
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
    console.error('Failed to synchronize models:', err);
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

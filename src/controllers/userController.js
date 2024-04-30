const User = require('../models/userModel'); // Importing the User model
const bcrypt = require('bcryptjs'); // Importing bcrypt for password hashing

exports.register = async (req, res) => { // Function to handle user registration
    const { username, email, password } = req.body; // Extracting username, email, and password from request body
    try {
        const hashedPassword = await bcrypt.hash(password, 12); // Hashing the password with bcrypt
        const newUser = await User.create({ // Creating a new user with hashed password
            username,
            email,
            password: hashedPassword
        });
        res.status(201).send('User registered'); // Sending success response if user is registered
    } catch (error) {
        res.status(500).json({ message: error.message }); // Sending error response if registration fails
    }
};

exports.login = async (req, res) => { // Function to handle user login
    const { email, password } = req.body; // Extracting email and password from request body
    console.log("Attempting to log in with:", email); // Logging the login attempt
    try {
        const user = await User.findOne({ where: { email } }); // Finding user by email
        if (!user) { // If user not found
            console.log("User not found for email:", email);
            return res.status(404).json({ message: 'User not found' }); // Sending error response
        }
        const isMatch = await bcrypt.compare(password, user.password); // Comparing passwords
        if (!isMatch) { // If passwords don't match
            console.log("Password mismatch for user:", email);
            return res.status(401).json({ message: 'Invalid credentials' }); // Sending error response
        }
        // Assuming session setup
        req.session.user = { id: user.id, username: user.username }; // Setting session user
        console.log("User logged in successfully:", user.username); // Logging successful login
        res.json({ message: 'Logged in successfully' }); // Sending success response
    } catch (error) {
        console.error('Login error:', error); // Logging login error
        res.status(500).json({ message: 'Error during login' }); // Sending error response
    }
};

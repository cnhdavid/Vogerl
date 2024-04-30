const { check, validationResult } = require('express-validator'); // Importing express-validator
const bcrypt = require('bcryptjs'); // Importing bcrypt for password hashing
const router = require('express').Router(); // Creating a router instance

router.post('/register', [ // Route for user registration with validation middleware
    check('username', 'Username is required').not().isEmpty(), // Validation for username
    check('email', 'Please include a valid email').isEmail(), // Validation for email
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }) // Validation for password
], async (req, res) => {
    const errors = validationResult(req); // Getting validation errors
    if (!errors.isEmpty()) { // If there are validation errors
        return res.status(400).json({ errors: errors.array() }); // Sending error response
    }

    try {
        const { username, email, password } = req.body; // Extracting username, email, and password
        const hashedPassword = await bcrypt.hash(password, 10); // Hashing the password

        // Create the user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).send('User registered successfully'); // Sending success response
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') { // If email is already in use
            return res.status(400).json({ message: 'Email already in use' }); // Sending error response
        }
        res.status(500).json({ message: error.message }); // Sending error response
    }
});

module.exports = router; // Exporting the router

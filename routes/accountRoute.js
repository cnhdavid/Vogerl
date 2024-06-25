const express = require('express');
const router = express.Router();
const { executeQuery } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../authenticate');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define routes for the /account endpoint

/**
 * @route POST /account/signup
 * @desc Register a new user
 * @param {string} username - The username of the new user
 * @param {string} email - The email of the new user
 * @param {string} password - The password of the new user
 * @param {string} date_of_birth - The date of birth of the new user in YYYY-MM-DD format
 * @param {string} first_name - The first name of the new user
 * @param {string} last_name - The last name of the new user
 * @returns {object} message - Success or error message
 */
router.post('/signup', async (req, res) => {
    const { username, email, password, date_of_birth, first_name, last_name } = req.body;

    const dob = new Date(date_of_birth);
    const formattedDOB = dob.toISOString().split('T')[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
        const userCheckResult = await executeQuery(userCheckQuery, [email]);

        if (userCheckResult.rows.length > 0) {
            return res.formatResponse({ message: 'Email already exists' }, 400);
        }

        const insertQuery = 'INSERT INTO users (username, email, password, date_of_birth, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)';
        await executeQuery(insertQuery, [username, email, hashedPassword, formattedDOB, first_name, last_name]);

        return res.formatResponse({ message: 'User created successfully' }, 201);
    } catch (error) {
        console.error('Error creating user:', error);
        return res.formatResponse({ message: 'Error creating user' }, 500);
    }
});

/**
 * @route POST /account/login
 * @desc Login a user and return a JWT token
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @param {string} recaptchaResponse - The reCAPTCHA response token
 * @returns {object} token - JWT token
 * @returns {string} role - The role of the user (admin/user)
 */
router.post('/login', async (req, res) => {
    const { email, password, recaptchaResponse } = req.body;

    // Verify reCAPTCHA
    const recaptchaSecret = '6Lf75vQpAAAAAEC3_zxEc3Xe6AlhzgkZsALXOUV8';
    const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaResponse}`;
    const recaptchaRes = await fetch(recaptchaUrl, { method: 'POST' });
    const recaptchaData = await recaptchaRes.json();

    if (!recaptchaData.success) {
        return res.formatResponse({ message: 'reCAPTCHA verification failed' }, 400);
    }

    try {
        const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
        const userCheckResult = await executeQuery(userCheckQuery, [email]);

        if (userCheckResult.rows.length === 0) {
            return res.formatResponse({ message: 'Invalid email or password' }, 400);
        }

        const user = userCheckResult.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.formatResponse({ message: 'Invalid email or password' }, 400);
        }

        const jwtSecretKey = process.env.JWT_SECRET_KEY;
        const token = jwt.sign({ userId: user.id, username: user.username, role: user.user_role }, jwtSecretKey, { expiresIn: '1h' });

        if (user.user_role === 'admin') {
            console.log('Admin login successful');
            return res.formatResponse({ token, role: 'admin' }, 200);
        } else {
            console.log('User login successful');
            return res.formatResponse({ token, role: 'user' }, 200);
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.formatResponse({ message: 'Internal server error' }, 500);
    }
});

/**
 * @route PUT /account/editProfile
 * @desc Edit user profile
 * @param {string} about - About text of the user
 * @param {string} username - The username of the user
 * @param {file} [image] - Optional profile picture file
 * @returns {object} message - Success or error message
 */
router.put('/editProfile', authenticateToken, upload.single('image'), async (req, res) => {
    let { about, username } = req.body;
    let image = null;
    console.log(about, username);

    if (req.file) {
        image = req.file.buffer.toString('base64');
    }

    try {
        let updateQuery;
        if (image === null) {
            updateQuery = 'UPDATE users SET about = $1 WHERE username = $2';
            await executeQuery(updateQuery, [about, username]);
        } else {
            updateQuery = 'UPDATE users SET about = $1, profilepic = $2 WHERE username = $3';
            await executeQuery(updateQuery, [about, image, username]);
        }

        return res.formatResponse({ message: 'Profile updated successfully' }, 200);
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.formatResponse({ message: 'Internal server error' }, 500);
    }
});

module.exports = router;

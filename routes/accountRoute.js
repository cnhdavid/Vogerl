
const express = require('express');
const router = express.Router();
const createPool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = createPool.createPool();
const authenticateToken = require('../authenticate');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



// Define routes for the /account endpoint
router.post('/signup', async(req, res) => {
    const { username, email, password, date_of_birth, first_name, last_name } = req.body;

    const dob = new Date(date_of_birth);
    const formattedDOB = dob.toISOString().split('T')[0];


   
        const hashedPassword = await bcrypt.hash(password, 10);

        pool.connect();
        try {
            const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
            const userCheckResult = await client.query(userCheckQuery, [email]);

            if (userCheckResult.rows.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            const insertQuery = 'INSERT INTO users (username, email, password, date_of_birth, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)';
            await pool.query(insertQuery, [username, email, hashedPassword, formattedDOB, first_name, last_name]);

            return res.status(201).json({ message: 'User created successfully' });
        } 
     catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Error creating user' });
    }
});

router.post('/login', async(req, res) => {
    const { email, password, recaptchaResponse } = req.body;



    try {

        // Verify reCAPTCHA
        const recaptchaSecret = '6Lf75vQpAAAAAEC3_zxEc3Xe6AlhzgkZsALXOUV8';
        const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaResponse}`;
        const recaptchaRes = await fetch(recaptchaUrl, { method: 'POST' });
        const recaptchaData = await recaptchaRes.json();

        if (!recaptchaData.success) {
            return res.status(400).json({ message: 'reCAPTCHA verification failed' });
        }

        
        try {
            const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
            const userCheckResult = await pool.query(userCheckQuery, [email]);

            if (userCheckResult.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid email or password' });
            }

            const user = userCheckResult.rows[0];

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(400).json({ message: 'Invalid email or password' });
            }
            jwtSecretKey = process.env.JWT_SECRET_KEY;



            const token = jwt.sign({ userId: user.id, username: user.username, role: user.user_role }, jwtSecretKey, { expiresIn: '1h' });

            if (user.user_role === 'admin') {
                console.log('Admin login successful');
                return res.status(200).json({ token, role: 'admin' });
            } else {
                console.log('User login successful');
                return res.status(200).json({ token, role: 'user' });
            }
        } catch (error) {
            console.error('Error logging in user:', error);
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/editProfile', authenticateToken, upload.single('image'), async(req, res) => {
    let { about, username } = req.body;
    let image = null;
    console.log(about, username);

    if (req.file) {
        image = req.file.buffer.toString('base64');
    }
    
    const client = await pool.connect();
    try {
        let updateQuery;
        if (image===null) {
             updateQuery = 'UPDATE users SET about = $1 WHERE username = $2';
             await client.query(updateQuery, [about, username]);
        } else {
             updateQuery = 'UPDATE users SET about = $1, profilepic = $2 WHERE username = $3';
             await client.query(updateQuery, [about, image, username]);
        }
        
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release(); // Release the client back to the pool
    }

});
module.exports = router;
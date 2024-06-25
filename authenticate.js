require('dotenv').config();
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Check if authorization header exists and extract token
    const token = authHeader && authHeader.split(' ')[1];
    const jwtSecretKey = process.env.JWT_SECRET_KEY;

    // If no token is provided, return 401 Unauthorized
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify JWT token using the secret key
        jwt.verify(token, jwtSecretKey, (err, user) => {
            if (err) {
                // If token is not valid, return 403 Forbidden
                return res.status(403).json({ message: 'Token is not valid' });
            }
            // If token is valid, set user information on request object and call next middleware
            req.user = user;
            next();
        });
    } catch (error) {
        // Handle any errors that occur during token verification
        console.error('Error authenticating token:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = authenticateToken;

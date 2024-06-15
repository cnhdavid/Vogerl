require('dotenv').config();
const jwt = require('jsonwebtoken');


const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    const token = authHeader && authHeader.split(' ')[1];
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    

    if (!token) {
        return res.status(401).json({ message: 'No token provided' }); // Unauthorized
    }

    try {
        

        

        jwt.verify(token, jwtSecretKey, (err, user) => {
            if (err) {
                
                return res.status(403).json({ message: 'Token is not valid' }); // Forbidden
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Error authenticating token:', error);
        
        res.status(500).json({ message: 'Internal Server Error' }); // Internal Server Error
    }
};

module.exports = authenticateToken;
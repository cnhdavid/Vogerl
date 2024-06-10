const jwt = require('jsonwebtoken');


const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' }); // Unauthorized
    }

    try {
        

        const jwtSecretKey = process.env.JWT_SECRET_KEY || crypto.randomBytes(64).toString('hex');
        process.env.JWT_SECRET_KEY = jwtSecretKey;

        jwt.verify(token, jwtSecretKey, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                     // Redirect to login page
                    return res.status(401).json({ message: 'Token expired' }); // Unauthorized


                }
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

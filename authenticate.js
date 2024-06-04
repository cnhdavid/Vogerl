const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' }); // Unauthorized
    }

    try {
        const decodedToken = jwt.decode(token);
        const username = decodedToken.username;

        const userQuery = 'SELECT jwt_secret_key FROM users WHERE username = $1';
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return res.status(403).json({ message: 'User not found' }); // Forbidden
        }

        const jwtSecretKey = userResult.rows[0].jwt_secret_key;

        jwt.verify(token, jwtSecretKey, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
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

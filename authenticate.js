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
        return res.sendStatus(401); // Unauthorized
    }

    try {
        const decodedToken = jwt.decode(token);
        const username = decodedToken.username;

        const userQuery = 'SELECT jwt_secret_key FROM users WHERE username = $1';
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return res.sendStatus(403); // Forbidden 
        }

        const jwtSecretKey = userResult.rows[0].jwt_secret_key;

        jwt.verify(token, jwtSecretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Error authenticating token:', error);
        res.sendStatus(500); // Internal Server Error
    }
};

module.exports = authenticateToken;

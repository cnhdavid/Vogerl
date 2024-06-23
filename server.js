require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authenticateToken = require('./authenticate');
const http = require('http');
const WebSocket = require('ws');
const createPool = require('./db');



const { filterProfanity, containsProfanity } = require('./public/js/modules/moderate');

const accountRoute = require('./routes/accountRoute');
const postRoute = require('./routes/postRoute');
const commentRoute = require('./routes/commentRoute');
const voteRoute = require('./routes/voteRoute');
const userRoute = require('./routes/userRoute');


let fetch;
(async() => {
    fetch = (await
        import ('node-fetch')).default;
})();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/account', accountRoute)
app.use('/post', postRoute)
app.use('/comments', commentRoute)
app.use('/vote', voteRoute)
app.use('/user', userRoute)

const server = http.createServer(app);
const pool = createPool.createPool();

// Create a WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });
wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
        console.log(`Received message: ${message}`);
    });

    // Send a message to the client when the server is shutting down
    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Send a welcome message
    ws.send('Welcome to the WebSocket server');
});

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('Server is shutting down');

    // Notify all connected WebSocket clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('Server is shutting down');
        }
    });

    // Close the server
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

app.get('/', (req, res) => {
    res.redirect('/dashboard.html');
});








server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
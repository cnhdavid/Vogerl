require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const path = require('path');
const xml2js = require('xml2js');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to handle response formatting
app.use((req, res, next) => {
    res.formatResponse = (data, statusCode = 200) => {
        const acceptHeader = req.headers['accept'];

        if (acceptHeader && acceptHeader.includes('application/xml')) {
            const builder = new xml2js.Builder();
            const xml = builder.buildObject(data);
            res.status(statusCode).type('application/xml').send(xml);
        } else {
            res.status(statusCode).json(data);
        }
    };
    next();
});

// Import and use routes
const accountRoute = require('./routes/accountRoute');
const postRoute = require('./routes/postRoute');
const commentRoute = require('./routes/commentRoute');
const voteRoute = require('./routes/voteRoute');
const userRoute = require('./routes/userRoute');
app.use('/account', accountRoute);
app.use('/post', postRoute);
app.use('/comments', commentRoute);
app.use('/vote', voteRoute);
app.use('/user', userRoute);

const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
        console.log(`Received message: ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.send('Welcome to the WebSocket server');
});

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('Server is shutting down');
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('Server is shutting down');
        }
    });
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
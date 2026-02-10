require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { initRedis } = require('./config/redis');
const { pool } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initSocket } = require('./socket/socketHandler');
const { setIO: setRequestIO } = require('./controllers/requestController');
const { setIO: setResponseIO } = require('./controllers/responseController');
const { setIO: setNotifIO } = require('./utils/notificationQueue');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/responses', require('./routes/responses'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/donors', require('./routes/donors'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Test DB connection
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected');

    // Init Redis
    await initRedis();

    // Init Socket.IO
    initSocket(io);
    setRequestIO(io);
    setResponseIO(io);
    setNotifIO(io);

    server.listen(PORT, () => {
      console.log(`BloodConnect server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

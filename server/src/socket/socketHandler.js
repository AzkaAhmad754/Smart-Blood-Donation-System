const jwt = require('jsonwebtoken');
const { setSocketMaps } = require('../controllers/requestController');

// Maps: userId -> socketId
const donorSocketMap = {};
const bankSocketMap = {};

const initSocket = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role, city } = socket.user;
    console.log(`Socket connected: ${userId} (${role})`);

    // Auto-join city room for blood banks
    if (role === 'blood_bank') {
      socket.join(`city:${city.toLowerCase()}`);
      bankSocketMap[userId] = socket.id;
    }

    // Donor registers as available
    socket.on('donor_available', ({ donor_user_id }) => {
      donorSocketMap[donor_user_id || userId] = socket.id;
      setSocketMaps(donorSocketMap, bankSocketMap);
    });

    // Hospital joins its own room for live updates
    socket.on('join_hospital_room', ({ hospital_id }) => {
      socket.join(`hospital:${hospital_id}`);
    });

    // Blood bank joins city room
    socket.on('join_bank_room', ({ city: bankCity }) => {
      socket.join(`city:${(bankCity || city).toLowerCase()}`);
    });

    socket.on('disconnect', () => {
      // Clean up maps
      if (role === 'donor') delete donorSocketMap[userId];
      if (role === 'blood_bank') delete bankSocketMap[userId];
      setSocketMaps(donorSocketMap, bankSocketMap);
      console.log(`Socket disconnected: ${userId}`);
    });
  });

  // Initialize maps
  setSocketMaps(donorSocketMap, bankSocketMap);
};

module.exports = { initSocket, donorSocketMap, bankSocketMap };

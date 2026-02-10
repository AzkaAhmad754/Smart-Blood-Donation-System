// Simple in-memory retry queue for failed socket notifications
// In production, replace with Bull/BullMQ backed by Redis

const queue = [];
let io = null;

const setIO = (socketIO) => { io = socketIO; };

const enqueue = (socketId, event, data, retries = 3) => {
  queue.push({ socketId, event, data, retries, attempts: 0 });
};

const processQueue = () => {
  const pending = queue.filter(item => item.attempts < item.retries);
  pending.forEach(item => {
    if (io) {
      const socket = io.sockets.sockets.get(item.socketId);
      if (socket) {
        socket.emit(item.event, item.data);
        item.attempts = item.retries; // mark done
      } else {
        item.attempts++;
      }
    }
  });
  // Clean up exhausted items
  queue.splice(0, queue.length, ...queue.filter(i => i.attempts < i.retries));
};

// Process every 5 seconds
setInterval(processQueue, 5000);

module.exports = { setIO, enqueue };

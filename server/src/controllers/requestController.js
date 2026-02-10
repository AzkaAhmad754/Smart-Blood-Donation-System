const requestModel = require('../models/requestModel');
const hospitalModel = require('../models/hospitalModel');
const { getRedis } = require('../config/redis');
const { findMatchingDonors, findMatchingBanks } = require('../utils/matchingEngine');

// Socket.IO instance injected at startup
let io = null;
const setIO = (socketIO) => { io = socketIO; };

// Socket ID maps (populated by socketHandler)
let donorSocketMap = {};
let bankSocketMap = {};
const setSocketMaps = (d, b) => { donorSocketMap = d; bankSocketMap = b; };

const postRequest = async (req, res, next) => {
  try {
    const { blood_type, quantity, urgency, notes } = req.body;
    if (!blood_type || !quantity || !urgency) {
      return res.status(400).json({ error: 'blood_type, quantity, urgency required' });
    }

    const hospital = await hospitalModel.findByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ error: 'Hospital profile not found' });

    const request = await requestModel.create({
      hospital_id: hospital.id,
      blood_type,
      quantity: parseInt(quantity),
      urgency,
      notes,
      city: req.user.city,
    });

    // Invalidate cache
    const redis = getRedis();
    if (redis) await redis.del(`active_requests:${req.user.city.toLowerCase()}`);

    // Fan out to matching donors and banks
    const [donors, banks] = await Promise.all([
      findMatchingDonors(blood_type, req.user.city),
      findMatchingBanks(req.user.city),
    ]);

    const payload = { ...request, hospital_name: req.user.name };

    if (io) {
      // Notify matched donors
      donors.forEach((donor) => {
        const socketId = donorSocketMap[donor.user_id];
        if (socketId) io.to(socketId).emit('new_request', payload);
      });

      // Notify blood banks in city room
      io.to(`city:${req.user.city.toLowerCase()}`).emit('new_request', payload);

      // Notify hospital's own room
      io.to(`hospital:${hospital.id}`).emit('request_created', payload);
    }

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

const getRequests = async (req, res, next) => {
  try {
    const { blood_type, city } = req.query;
    const cacheKey = `active_requests:${(city || 'all').toLowerCase()}`;
    const redis = getRedis();

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const requests = await requestModel.getActive({ blood_type, city });

    if (redis) await redis.setEx(cacheKey, 30, JSON.stringify(requests));
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await requestModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Request not found' });

    const hospital = await hospitalModel.findByUserId(req.user.id);
    if (!hospital || existing.hospital_id !== hospital.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await requestModel.updateStatus(id, status);

    const redis = getRedis();
    if (redis) await redis.del(`active_requests:${existing.city.toLowerCase()}`);

    if (io && status === 'fulfilled') {
      io.emit('request_fulfilled', { request_id: id });
      io.emit('alert_cancelled', { request_id: id });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const getHospitalRequests = async (req, res, next) => {
  try {
    const hospital = await hospitalModel.findByUserId(req.user.id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    const requests = await requestModel.getByHospitalId(hospital.id);

    // Attach stats to each request
    const withStats = await Promise.all(
      requests.map(async (r) => {
        const stats = await requestModel.getResponseStats(r.id);
        return { ...r, stats };
      })
    );

    res.json(withStats);
  } catch (err) {
    next(err);
  }
};

module.exports = { postRequest, getRequests, updateRequestStatus, getHospitalRequests, setIO, setSocketMaps };

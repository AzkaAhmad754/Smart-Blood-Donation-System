const { getClient } = require('../config/db');
const responseModel = require('../models/responseModel');
const requestModel = require('../models/requestModel');
const donorModel = require('../models/donorModel');
const bloodBankModel = require('../models/bloodBankModel');
const { getRedis } = require('../config/redis');

let io = null;
const setIO = (socketIO) => { io = socketIO; };

const donorRespond = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { request_id, status } = req.body;
    if (!request_id || !status) return res.status(400).json({ error: 'request_id and status required' });

    const donor = await donorModel.findByUserId(req.user.id);
    if (!donor) return res.status(404).json({ error: 'Donor profile not found' });

    const request = await requestModel.findById(request_id);
    if (!request || request.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Request is no longer active' });
    }

    const response = await responseModel.upsertDonorResponse({ request_id, donor_id: donor.id, status });

    if (status === 'accepted') {
      const acceptedCount = await responseModel.countAcceptedDonors(request_id);
      if (acceptedCount >= request.quantity) {
        await requestModel.updateStatus(request_id, 'fulfilled');
        await client.query('COMMIT');

        const redis = getRedis();
        if (redis) await redis.del(`active_requests:${request.city.toLowerCase()}`);

        if (io) {
          io.emit('request_fulfilled', { request_id });
          io.emit('alert_cancelled', { request_id });
        }
        return res.json({ response, fulfilled: true });
      }

      if (io) {
        io.to(`hospital:${request.hospital_id}`).emit('donor_accepted', {
          request_id,
          donor_name: req.user.name,
          accepted_count: acceptedCount,
        });
      }
    }

    await client.query('COMMIT');
    res.json({ response, fulfilled: false });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const bankRespond = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { request_id, units_committed } = req.body;
    if (!request_id || !units_committed) return res.status(400).json({ error: 'request_id and units_committed required' });

    const bank = await bloodBankModel.findByUserId(req.user.id);
    if (!bank) return res.status(404).json({ error: 'Blood bank profile not found' });

    const request = await requestModel.findById(request_id);
    if (!request || request.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Request is no longer active' });
    }

    const response = await responseModel.upsertBankResponse({
      request_id,
      bank_id: bank.id,
      status: 'confirmed',
      units_committed: parseInt(units_committed),
    });

    const totalCommitted = await responseModel.countConfirmedBanks(request_id);
    if (totalCommitted >= request.quantity) {
      await requestModel.updateStatus(request_id, 'fulfilled');
      await client.query('COMMIT');

      const redis = getRedis();
      if (redis) await redis.del(`active_requests:${request.city.toLowerCase()}`);

      if (io) {
        io.emit('request_fulfilled', { request_id });
        io.emit('alert_cancelled', { request_id });
      }
      return res.json({ response, fulfilled: true });
    }

    if (io) {
      io.to(`hospital:${request.hospital_id}`).emit('bank_confirmed', {
        request_id,
        bank_name: req.user.name,
        units_committed,
      });
    }

    await client.query('COMMIT');
    res.json({ response, fulfilled: false });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { donorRespond, bankRespond, setIO };

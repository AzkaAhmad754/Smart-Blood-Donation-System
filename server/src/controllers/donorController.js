const donorModel = require('../models/donorModel');

const getNearby = async (req, res, next) => {
  try {
    const { blood_type, city } = req.query;
    if (!blood_type || !city) return res.status(400).json({ error: 'blood_type and city required' });
    const donors = await donorModel.findNearby(blood_type, city);
    res.json(donors);
  } catch (err) {
    next(err);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    const donor = await donorModel.updateAvailability(req.user.id, availability);
    res.json(donor);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const donor = await donorModel.findByUserId(req.user.id);
    if (!donor) return res.status(404).json({ error: 'Donor not found' });
    const history = await donorModel.getDonationHistory(donor.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const donor = await donorModel.findByUserId(req.user.id);
    res.json(donor);
  } catch (err) {
    next(err);
  }
};

module.exports = { getNearby, updateAvailability, getHistory, getProfile };

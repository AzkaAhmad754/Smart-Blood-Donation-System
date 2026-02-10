const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const donorModel = require('../models/donorModel');
const hospitalModel = require('../models/hospitalModel');
const bloodBankModel = require('../models/bloodBankModel');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, city, phone, blood_type, license_number, inventory } = req.body;

    if (!name || !email || !password || !role || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ name, email, password_hash, role, city, phone });

    if (role === 'donor') {
      if (!blood_type) return res.status(400).json({ error: 'Blood type required for donors' });
      await donorModel.create({ user_id: user.id, blood_type });
    } else if (role === 'hospital') {
      if (!license_number) return res.status(400).json({ error: 'License number required' });
      await hospitalModel.create({ user_id: user.id, license_number });
    } else if (role === 'blood_bank') {
      if (!license_number) return res.status(400).json({ error: 'License number required' });
      const bank = await bloodBankModel.create({ user_id: user.id, license_number });
      await bloodBankModel.initInventory(bank.id);
    }

    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await userModel.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = null;
    if (user.role === 'donor') {
      profile = await donorModel.findByUserId(user.id);
    } else if (user.role === 'hospital') {
      profile = await hospitalModel.findByUserId(user.id);
    } else if (user.role === 'blood_bank') {
      profile = await bloodBankModel.findByUserId(user.id);
    }

    res.json({ user, profile });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };

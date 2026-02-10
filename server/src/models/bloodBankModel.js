const db = require('../config/db');

const create = async ({ user_id, license_number }) => {
  const { rows } = await db.query(
    'INSERT INTO blood_banks (user_id, license_number) VALUES ($1,$2) RETURNING *',
    [user_id, license_number]
  );
  return rows[0];
};

const findByUserId = async (user_id) => {
  const { rows } = await db.query('SELECT * FROM blood_banks WHERE user_id = $1', [user_id]);
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM blood_banks WHERE id = $1', [id]);
  return rows[0];
};

const findByCity = async (city) => {
  const { rows } = await db.query(
    `SELECT bb.*, u.name, u.city FROM blood_banks bb
     JOIN users u ON bb.user_id = u.id
     WHERE u.city ILIKE $1`,
    [city]
  );
  return rows;
};

// Initialize all 8 blood types for a new bank
const initInventory = async (blood_bank_id) => {
  const types = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
  const values = types.map((t, i) => `($1, $${i + 2}, 0)`).join(',');
  await db.query(
    `INSERT INTO blood_inventory (blood_bank_id, blood_type, units) VALUES ${values} ON CONFLICT DO NOTHING`,
    [blood_bank_id, ...types]
  );
};

module.exports = { create, findByUserId, findById, findByCity, initInventory };

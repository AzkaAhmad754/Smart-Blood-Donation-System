const db = require('../config/db');

const findByEmail = async (email) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT id, name, email, role, city, phone, created_at FROM users WHERE id = $1', [id]);
  return rows[0];
};

const create = async ({ name, email, password_hash, role, city, phone }) => {
  const { rows } = await db.query(
    'INSERT INTO users (name, email, password_hash, role, city, phone) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, city, phone, created_at',
    [name, email, password_hash, role, city, phone]
  );
  return rows[0];
};

module.exports = { findByEmail, findById, create };

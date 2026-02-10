const db = require('../config/db');

const create = async ({ user_id, license_number }) => {
  const { rows } = await db.query(
    'INSERT INTO hospitals (user_id, license_number) VALUES ($1,$2) RETURNING *',
    [user_id, license_number]
  );
  return rows[0];
};

const findByUserId = async (user_id) => {
  const { rows } = await db.query('SELECT * FROM hospitals WHERE user_id = $1', [user_id]);
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM hospitals WHERE id = $1', [id]);
  return rows[0];
};

module.exports = { create, findByUserId, findById };

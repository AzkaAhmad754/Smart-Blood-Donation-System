const db = require('../config/db');

const create = async ({ user_id, blood_type, availability = true, lat, lng }) => {
  const { rows } = await db.query(
    'INSERT INTO donors (user_id, blood_type, availability, lat, lng) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [user_id, blood_type, availability, lat || null, lng || null]
  );
  return rows[0];
};

const findByUserId = async (user_id) => {
  const { rows } = await db.query('SELECT * FROM donors WHERE user_id = $1', [user_id]);
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM donors WHERE id = $1', [id]);
  return rows[0];
};

const updateAvailability = async (user_id, availability) => {
  const { rows } = await db.query(
    'UPDATE donors SET availability = $1 WHERE user_id = $2 RETURNING *',
    [availability, user_id]
  );
  return rows[0];
};

const findNearby = async (blood_type, city) => {
  const { rows } = await db.query(
    `SELECT d.*, u.name, u.email, u.city, u.phone
     FROM donors d
     JOIN users u ON d.user_id = u.id
     WHERE d.blood_type = $1 AND u.city ILIKE $2 AND d.availability = true`,
    [blood_type, city]
  );
  return rows;
};

const getDonationHistory = async (donor_id) => {
  const { rows } = await db.query(
    `SELECT dr.*, br.blood_type, br.urgency, br.created_at as request_date, u.name as hospital_name
     FROM donor_responses dr
     JOIN blood_requests br ON dr.request_id = br.id
     JOIN hospitals h ON br.hospital_id = h.id
     JOIN users u ON h.user_id = u.id
     WHERE dr.donor_id = $1
     ORDER BY dr.responded_at DESC`,
    [donor_id]
  );
  return rows;
};

module.exports = { create, findByUserId, findById, updateAvailability, findNearby, getDonationHistory };

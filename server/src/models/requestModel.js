const db = require('../config/db');

const create = async ({ hospital_id, blood_type, quantity, urgency, notes, city }) => {
  const { rows } = await db.query(
    `INSERT INTO blood_requests (hospital_id, blood_type, quantity, urgency, notes, city)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [hospital_id, blood_type, quantity, urgency, notes || null, city]
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT br.*, u.name as hospital_name, u.city as hospital_city
     FROM blood_requests br
     JOIN hospitals h ON br.hospital_id = h.id
     JOIN users u ON h.user_id = u.id
     WHERE br.id = $1`,
    [id]
  );
  return rows[0];
};

const getActive = async ({ blood_type, city } = {}) => {
  let q = `SELECT br.*, u.name as hospital_name
           FROM blood_requests br
           JOIN hospitals h ON br.hospital_id = h.id
           JOIN users u ON h.user_id = u.id
           WHERE br.status = 'active'`;
  const params = [];
  if (blood_type) { params.push(blood_type); q += ` AND br.blood_type = $${params.length}`; }
  if (city) { params.push(city); q += ` AND br.city ILIKE $${params.length}`; }
  q += ' ORDER BY br.created_at DESC';
  const { rows } = await db.query(q, params);
  return rows;
};

const getByHospitalId = async (hospital_id) => {
  const { rows } = await db.query(
    `SELECT * FROM blood_requests WHERE hospital_id = $1 ORDER BY created_at DESC`,
    [hospital_id]
  );
  return rows;
};

const updateStatus = async (id, status) => {
  const fulfilled_at = status === 'fulfilled' ? 'NOW()' : 'NULL';
  const { rows } = await db.query(
    `UPDATE blood_requests SET status = $1, fulfilled_at = ${fulfilled_at} WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
};

const getResponseStats = async (request_id) => {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'accepted') as donors_accepted,
       COUNT(*) FILTER (WHERE status = 'declined') as donors_declined,
       COUNT(*) FILTER (WHERE status = 'pending') as donors_pending,
       COUNT(*) as donors_notified
     FROM donor_responses WHERE request_id = $1`,
    [request_id]
  );
  const bankRows = await db.query(
    `SELECT COUNT(*) FILTER (WHERE status = 'confirmed') as banks_confirmed
     FROM bank_responses WHERE request_id = $1`,
    [request_id]
  );
  return { ...rows[0], ...bankRows.rows[0] };
};

module.exports = { create, findById, getActive, getByHospitalId, updateStatus, getResponseStats };

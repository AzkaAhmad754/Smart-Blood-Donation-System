const db = require('../config/db');

const upsertDonorResponse = async ({ request_id, donor_id, status }) => {
  const { rows } = await db.query(
    `INSERT INTO donor_responses (request_id, donor_id, status, responded_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (request_id, donor_id)
     DO UPDATE SET status = $3, responded_at = NOW()
     RETURNING *`,
    [request_id, donor_id, status]
  );
  return rows[0];
};

const upsertBankResponse = async ({ request_id, bank_id, status, units_committed }) => {
  const { rows } = await db.query(
    `INSERT INTO bank_responses (request_id, bank_id, status, units_committed, responded_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (request_id, bank_id)
     DO UPDATE SET status = $3, units_committed = $4, responded_at = NOW()
     RETURNING *`,
    [request_id, bank_id, status, units_committed || 0]
  );
  return rows[0];
};

const countAcceptedDonors = async (request_id) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) as count FROM donor_responses WHERE request_id = $1 AND status = 'accepted'`,
    [request_id]
  );
  return parseInt(rows[0].count);
};

const countConfirmedBanks = async (request_id) => {
  const { rows } = await db.query(
    `SELECT COALESCE(SUM(units_committed), 0) as total FROM bank_responses WHERE request_id = $1 AND status = 'confirmed'`,
    [request_id]
  );
  return parseInt(rows[0].total);
};

module.exports = { upsertDonorResponse, upsertBankResponse, countAcceptedDonors, countConfirmedBanks };

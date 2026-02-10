const db = require('../config/db');

const getByBankId = async (blood_bank_id) => {
  const { rows } = await db.query(
    'SELECT * FROM blood_inventory WHERE blood_bank_id = $1 ORDER BY blood_type',
    [blood_bank_id]
  );
  return rows;
};

const updateUnits = async (blood_bank_id, blood_type, units) => {
  const { rows } = await db.query(
    `INSERT INTO blood_inventory (blood_bank_id, blood_type, units, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (blood_bank_id, blood_type)
     DO UPDATE SET units = $3, updated_at = NOW()
     RETURNING *`,
    [blood_bank_id, blood_type, units]
  );
  return rows[0];
};

const adjustUnits = async (blood_bank_id, blood_type, delta) => {
  const { rows } = await db.query(
    `UPDATE blood_inventory SET units = GREATEST(0, units + $3), updated_at = NOW()
     WHERE blood_bank_id = $1 AND blood_type = $2
     RETURNING *`,
    [blood_bank_id, blood_type, delta]
  );
  return rows[0];
};

module.exports = { getByBankId, updateUnits, adjustUnits };

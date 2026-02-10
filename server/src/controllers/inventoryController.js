const inventoryModel = require('../models/inventoryModel');
const bloodBankModel = require('../models/bloodBankModel');

const getInventory = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const inventory = await inventoryModel.getByBankId(bankId);
    res.json(inventory);
  } catch (err) {
    next(err);
  }
};

const updateInventory = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const { blood_type, units } = req.body;

    if (!blood_type || units === undefined) {
      return res.status(400).json({ error: 'blood_type and units required' });
    }

    // Verify ownership
    const bank = await bloodBankModel.findByUserId(req.user.id);
    if (!bank || bank.id !== bankId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await inventoryModel.updateUnits(bankId, blood_type, parseInt(units));
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const getMyInventory = async (req, res, next) => {
  try {
    const bank = await bloodBankModel.findByUserId(req.user.id);
    if (!bank) return res.status(404).json({ error: 'Blood bank not found' });
    const inventory = await inventoryModel.getByBankId(bank.id);
    res.json({ bank, inventory });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInventory, updateInventory, getMyInventory };

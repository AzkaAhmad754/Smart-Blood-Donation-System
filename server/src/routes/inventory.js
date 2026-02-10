const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getInventory, updateInventory, getMyInventory } = require('../controllers/inventoryController');

router.get('/me', authenticate, authorize('blood_bank'), getMyInventory);
router.get('/:bankId', authenticate, getInventory);
router.patch('/:bankId', authenticate, authorize('blood_bank'), updateInventory);

module.exports = router;

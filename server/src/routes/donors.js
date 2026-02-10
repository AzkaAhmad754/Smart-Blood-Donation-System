const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getNearby, updateAvailability, getHistory, getProfile } = require('../controllers/donorController');

router.get('/nearby', authenticate, getNearby);
router.get('/profile', authenticate, authorize('donor'), getProfile);
router.get('/history', authenticate, authorize('donor'), getHistory);
router.patch('/availability', authenticate, authorize('donor'), updateAvailability);

module.exports = router;

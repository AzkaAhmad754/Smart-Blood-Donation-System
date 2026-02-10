const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { donorRespond, bankRespond } = require('../controllers/responseController');

router.post('/donor', authenticate, authorize('donor'), donorRespond);
router.post('/bank', authenticate, authorize('blood_bank'), bankRespond);

module.exports = router;

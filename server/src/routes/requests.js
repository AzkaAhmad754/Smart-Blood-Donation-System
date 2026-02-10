const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  postRequest,
  getRequests,
  updateRequestStatus,
  getHospitalRequests,
} = require('../controllers/requestController');

router.post('/', authenticate, authorize('hospital'), postRequest);
router.get('/', authenticate, getRequests);
router.get('/mine', authenticate, authorize('hospital'), getHospitalRequests);
router.patch('/:id/status', authenticate, authorize('hospital'), updateRequestStatus);

module.exports = router;

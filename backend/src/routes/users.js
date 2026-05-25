const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getProfile, upsertProfile, getMeasurementHistory,
  getHealthScoreHistory, acceptLegal,
} = require('../controllers/userController');

const router = Router();

router.use(requireAuth);

router.get('/',                          asyncHandler(getProfile));
router.put('/',                          asyncHandler(upsertProfile));
router.get('/measurements',              asyncHandler(getMeasurementHistory));
router.get('/health-scores',             asyncHandler(getHealthScoreHistory));
router.post('/legal/:type/accept',       asyncHandler(acceptLegal));

module.exports = router;

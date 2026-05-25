const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { pullChanges, pushChanges } = require('../controllers/syncController');

const router = Router();

router.use(requireAuth);

router.get('/pull',   asyncHandler(pullChanges));   // ?last_synced_at=ISO_TIMESTAMP
router.post('/push',  asyncHandler(pushChanges));

module.exports = router;

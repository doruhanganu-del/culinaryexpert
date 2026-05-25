const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  createOrRegeneratePlan, getActivePlan,
  submitFeedback, getBatchCookingPlan,
} = require('../controllers/mealPlanController');

const router = Router();

router.use(requireAuth);

router.post('/',                               asyncHandler(createOrRegeneratePlan));
router.get('/active',                          asyncHandler(getActivePlan));
router.post('/meals/:meal_id/feedback',        asyncHandler(submitFeedback));
router.get('/:plan_id/batch-cooking',          asyncHandler(getBatchCookingPlan));

module.exports = router;

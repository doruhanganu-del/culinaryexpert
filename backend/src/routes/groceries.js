const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateGroceryList, getGroceryList, toggleItem } = require('../controllers/groceryController');

const router = Router();

router.use(requireAuth);

router.post('/',                    asyncHandler(generateGroceryList));
router.get('/:list_id',             asyncHandler(getGroceryList));
router.patch('/items/:item_id',     asyncHandler(toggleItem));

module.exports = router;

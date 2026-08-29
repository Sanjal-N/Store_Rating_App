const express = require('express');
const { listStores, getStoreById } = require('../controllers/storeController');
const { upsertRating, listRatingsForStore } = require('../controllers/ratingController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listStores);
router.get('/:id', getStoreById);

// Only Normal Users submit/modify ratings
router.post('/:storeId/ratings', requireRole('user'), upsertRating);
router.put('/:storeId/ratings', requireRole('user'), upsertRating);

// Admin can inspect all ratings for any store (store owners use their
// own dashboard endpoint instead, which is scoped to their store only)
router.get('/:storeId/ratings', requireRole('admin'), listRatingsForStore);

module.exports = router;

const express = require('express');
const { getOwnerDashboard } = require('../controllers/storeController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('store_owner'));

router.get('/dashboard', getOwnerDashboard);

module.exports = router;

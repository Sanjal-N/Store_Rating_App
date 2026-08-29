const express = require('express');
const {
  getDashboard,
  createUser,
  listUsers,
  getUserById,
  createStore,
  listStoreOwners,
} = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every route on this router is admin-only
router.use(authenticate, requireRole('admin'));

router.get('/dashboard', getDashboard);

router.get('/users', listUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserById);

router.post('/stores', createStore);
router.get('/store-owners', listStoreOwners);

module.exports = router;

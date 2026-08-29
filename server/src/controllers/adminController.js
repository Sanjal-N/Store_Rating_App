const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const {
  validateName,
  validateAddress,
  validateEmail,
  validatePassword,
  validateRole,
} = require('../utils/validation');

const SALT_ROUNDS = 10;

// GET /api/admin/dashboard
async function getDashboard(req, res, next) {
  try {
    const [users, stores, ratings] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM users'),
      pool.query('SELECT COUNT(*)::int AS count FROM stores'),
      pool.query('SELECT COUNT(*)::int AS count FROM ratings'),
    ]);

    res.json({
      totalUsers: users.rows[0].count,
      totalStores: stores.rows[0].count,
      totalRatings: ratings.rows[0].count,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/users - admin creates a user of any role
async function createUser(req, res, next) {
  try {
    const { name, email, password, address, role } = req.body;

    const errors = [
      validateName(name),
      validateEmail(email),
      validatePassword(password),
      validateAddress(address),
      validateRole(role),
    ].filter(Boolean);

    if (errors.length > 0) {
      throw new AppError(400, errors[0]);
    }

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rows.length > 0) {
      throw new AppError(409, 'An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, address, role, created_at`,
      [name.trim(), email.trim(), passwordHash, address.trim(), role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

const USER_SORT_COLUMNS = { name: 'name', email: 'email', address: 'address', role: 'role' };

// GET /api/admin/users?name=&email=&address=&role=&sortBy=&sortOrder=
async function listUsers(req, res, next) {
  try {
    const { name, email, address, role, sortBy, sortOrder } = req.query;

    const conditions = [];
    const values = [];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }
    if (email) {
      values.push(`%${email}%`);
      conditions.push(`email ILIKE $${values.length}`);
    }
    if (address) {
      values.push(`%${address}%`);
      conditions.push(`address ILIKE $${values.length}`);
    }
    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderColumn = USER_SORT_COLUMNS[sortBy] || 'name';
    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const result = await pool.query(
      `SELECT id, name, email, address, role, created_at
       FROM users
       ${whereClause}
       ORDER BY ${orderColumn} ${orderDirection}`,
      values
    );

    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users/:id
async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
      [id]
    );
    const user = userResult.rows[0];

    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    let store = null;
    if (user.role === 'store_owner') {
      const storeResult = await pool.query(
        `SELECT s.id, s.name, s.email, s.address,
                COALESCE(AVG(r.rating), 0)::float AS average_rating,
                COUNT(r.id)::int AS rating_count
         FROM stores s
         LEFT JOIN ratings r ON r.store_id = s.id
         WHERE s.owner_id = $1
         GROUP BY s.id`,
        [user.id]
      );
      store = storeResult.rows[0] || null;
    }

    res.json({ user, store });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/stores
async function createStore(req, res, next) {
  try {
    const { name, email, address, ownerId } = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError(400, 'Store name is required.');
    }
    const emailError = validateEmail(email);
    if (emailError) throw new AppError(400, emailError);
    const addressError = validateAddress(address);
    if (addressError) throw new AppError(400, addressError);
    if (!ownerId) {
      throw new AppError(400, 'A store owner must be selected.');
    }

    const ownerResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [ownerId]);
    const owner = ownerResult.rows[0];
    if (!owner) {
      throw new AppError(400, 'Selected store owner does not exist.');
    }
    if (owner.role !== 'store_owner') {
      throw new AppError(400, 'Selected user does not have the Store Owner role.');
    }

    const result = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, owner_id, created_at`,
      [name.trim(), email.trim(), address.trim(), ownerId]
    );

    res.status(201).json({ store: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/store-owners - helper for the "add store" form dropdown
async function listStoreOwners(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'store_owner' ORDER BY name"
    );
    res.json({ storeOwners: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  createUser,
  listUsers,
  getUserById,
  createStore,
  listStoreOwners,
};

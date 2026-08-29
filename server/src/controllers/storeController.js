const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { validateEmail, validateAddress } = require('../utils/validation');

const STORE_SORT_COLUMNS = {
  name: 's.name',
  email: 's.email',
  address: 's.address',
  rating: 'average_rating',
};

// GET /api/stores?name=&address=&sortBy=&sortOrder=
// Used by both the Admin store list and the Normal User store list.
// When the requester is a Normal User, each store also carries their
// own submitted rating (or null) for that store.
async function listStores(req, res, next) {
  try {
    const { name, email, address, sortBy, sortOrder } = req.query;

    const conditions = [];
    const values = [];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`s.name ILIKE $${values.length}`);
    }
    if (email) {
      values.push(`%${email}%`);
      conditions.push(`s.email ILIKE $${values.length}`);
    }
    if (address) {
      values.push(`%${address}%`);
      conditions.push(`s.address ILIKE $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderColumn = STORE_SORT_COLUMNS[sortBy] || 's.name';
    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const result = await pool.query(
      `SELECT s.id, s.name, s.email, s.address, s.owner_id,
              COALESCE(AVG(r.rating), 0)::float AS average_rating,
              COUNT(r.id)::int AS rating_count
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       ${whereClause}
       GROUP BY s.id
       ORDER BY ${orderColumn} ${orderDirection}`,
      values
    );

    let stores = result.rows;

    if (req.user.role === 'user') {
      const myRatings = await pool.query('SELECT store_id, rating FROM ratings WHERE user_id = $1', [
        req.user.id,
      ]);
      const ratingByStore = new Map(myRatings.rows.map((r) => [r.store_id, r.rating]));
      stores = stores.map((store) => ({
        ...store,
        my_rating: ratingByStore.has(store.id) ? ratingByStore.get(store.id) : null,
      }));
    }

    res.json({ stores });
  } catch (err) {
    next(err);
  }
}

// GET /api/stores/:id
async function getStoreById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.id, s.name, s.email, s.address, s.owner_id,
              COALESCE(AVG(r.rating), 0)::float AS average_rating,
              COUNT(r.id)::int AS rating_count
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Store not found.');
    }

    res.json({ store: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/store-owner/dashboard
// Only returns data for the store owned by the logged-in Store Owner.
async function getOwnerDashboard(req, res, next) {
  try {
    const storeResult = await pool.query(
      `SELECT s.id, s.name, s.email, s.address,
              COALESCE(AVG(r.rating), 0)::float AS average_rating,
              COUNT(r.id)::int AS rating_count
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.owner_id = $1
       GROUP BY s.id`,
      [req.user.id]
    );

    const store = storeResult.rows[0];
    if (!store) {
      // A store owner account was created but no store has been
      // linked to them yet - a valid state, not an error.
      return res.json({ store: null, raters: [] });
    }

    const ratersResult = await pool.query(
      `SELECT u.name AS user_name, u.email AS user_email, r.rating, r.created_at
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.store_id = $1
       ORDER BY r.created_at DESC`,
      [store.id]
    );

    res.json({ store, raters: ratersResult.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { listStores, getStoreById, getOwnerDashboard };

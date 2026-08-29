const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { validateRating } = require('../utils/validation');

// POST /api/stores/:storeId/ratings
// PUT  /api/stores/:storeId/ratings
// Same handler for both: creating and modifying a rating is really the
// same "set my rating for this store" operation, enforced by the
// UNIQUE(user_id, store_id) constraint via an upsert.
async function upsertRating(req, res, next) {
  try {
    const { storeId } = req.params;
    const rating = Number(req.body.rating);

    const ratingError = validateRating(rating);
    if (ratingError) {
      throw new AppError(400, ratingError);
    }

    const storeResult = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (storeResult.rows.length === 0) {
      throw new AppError(404, 'Store not found.');
    }

    const result = await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, store_id)
       DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
       RETURNING id, user_id, store_id, rating, created_at, updated_at`,
      [req.user.id, storeId, rating]
    );

    res.status(200).json({ rating: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/stores/:storeId/ratings - all ratings for a store (store owner / admin use)
async function listRatingsForStore(req, res, next) {
  try {
    const { storeId } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.rating, r.created_at, u.name AS user_name, u.email AS user_email
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.store_id = $1
       ORDER BY r.created_at DESC`,
      [storeId]
    );
    res.json({ ratings: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { upsertRating, listRatingsForStore };

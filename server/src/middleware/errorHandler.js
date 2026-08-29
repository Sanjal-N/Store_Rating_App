// A small typed error so controllers can throw with an explicit status
// code instead of scattering res.status(...).json(...) everywhere.
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Express recognises this as an error handler because it takes 4 args.
// Keep it last in the middleware chain.
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Postgres unique-violation - most likely a duplicate email or a
  // duplicate (user_id, store_id) rating.
  if (err.code === '23505') {
    return res.status(409).json({ message: 'That record already exists.' });
  }

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    message: statusCode === 500 ? 'Something went wrong on the server.' : err.message,
  });
}

module.exports = { AppError, errorHandler };

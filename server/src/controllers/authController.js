const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const {
  validateName,
  validateAddress,
  validateEmail,
  validatePassword,
} = require('../utils/validation');

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Never send the password hash back to the client
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    address: user.address,
    role: user.role,
  };
}

// POST /api/auth/register
// Public self-registration. Always creates a "user" (Normal User) role,
// regardless of what the client sends - this is a security requirement,
// not just a default.
async function register(req, res, next) {
  try {
    const { name, email, password, address } = req.body;

    const errors = [
      validateName(name),
      validateEmail(email),
      validatePassword(password),
      validateAddress(address),
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
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, address, role`,
      [name.trim(), email.trim(), passwordHash, address.trim()]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required.');
    }

    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const user = result.rows[0];

    // Use the same error for "no such user" and "wrong password" so we
    // don't leak which emails are registered.
    if (!user) {
      throw new AppError(401, 'Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      throw new AppError(401, 'Invalid email or password.');
    }

    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me - lets the frontend re-hydrate auth state on refresh
async function me(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, address, role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      throw new AppError(404, 'User not found.');
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/change-password - works for any authenticated role
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      throw new AppError(400, 'All password fields are required.');
    }
    if (newPassword !== confirmNewPassword) {
      throw new AppError(400, 'New password and confirmation do not match.');
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      throw new AppError(400, passwordError);
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    const currentMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!currentMatches) {
      throw new AppError(401, 'Current password is incorrect.');
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      newHash,
      user.id,
    ]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, changePassword };

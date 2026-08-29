// Simple, dependency-free validators shared by every controller that
// accepts user input. Each function returns an error message string,
// or null when the value is valid.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least one uppercase letter and one special (non-alphanumeric) character
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

function validateName(name) {
  const trimmed = (name || '').trim();
  if (trimmed.length < 20) return 'Name must be at least 20 characters long.';
  if (trimmed.length > 60) return 'Name must be at most 60 characters long.';
  return null;
}

function validateAddress(address) {
  const trimmed = (address || '').trim();
  if (trimmed.length === 0) return 'Address is required.';
  if (trimmed.length > 400) return 'Address must be at most 400 characters long.';
  return null;
}

function validateEmail(email) {
  const trimmed = (email || '').trim();
  if (trimmed.length === 0) return 'Email is required.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Email is not a valid email address.';
  return null;
}

function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must be 8-16 characters and include at least one uppercase letter and one special character.';
  }
  return null;
}

function validateRating(rating) {
  if (rating === undefined || rating === null || rating === '') {
    return 'Rating is required.';
  }
  if (!Number.isInteger(rating)) return 'Rating must be a whole number.';
  if (rating < 1 || rating > 5) return 'Rating must be between 1 and 5.';
  return null;
}

function validateRole(role) {
  const allowed = ['admin', 'user', 'store_owner'];
  if (!allowed.includes(role)) return `Role must be one of: ${allowed.join(', ')}.`;
  return null;
}

module.exports = {
  validateName,
  validateAddress,
  validateEmail,
  validatePassword,
  validateRating,
  validateRole,
};

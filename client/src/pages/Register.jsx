import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email, password, address }) {
  const trimmedName = name.trim();
  if (trimmedName.length < 20 || trimmedName.length > 60) {
    return 'Name must be between 20 and 60 characters.';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must be 8-16 characters, with an uppercase letter and a special character.';
  }
  if (address.trim().length === 0 || address.trim().length > 400) {
    return 'Address is required and must be under 400 characters.';
  }
  return null;
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const data = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/stores');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        {error && <p className="form-error">{error}</p>}

        <label htmlFor="name">Full name</label>
        <input id="name" value={form.name} onChange={update('name')} required />
        <p className="field-hint">20-60 characters</p>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={update('email')} required />

        <label htmlFor="address">Address</label>
        <textarea id="address" value={form.address} onChange={update('address')} required maxLength={400} />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={update('password')}
          required
        />
        <p className="field-hint">8-16 characters, one uppercase letter, one special character</p>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}

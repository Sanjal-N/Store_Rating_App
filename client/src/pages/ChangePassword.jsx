import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export default function ChangePassword() {
  const { token } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess('');

    if (form.newPassword !== form.confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (!PASSWORD_REGEX.test(form.newPassword)) {
      setError('New password must be 8-16 characters, with an uppercase letter and a special character.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', form, token);
      setSuccess('Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Change password</h1>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <label htmlFor="currentPassword">Current password</label>
        <input
          id="currentPassword"
          type="password"
          value={form.currentPassword}
          onChange={update('currentPassword')}
          required
        />

        <label htmlFor="newPassword">New password</label>
        <input
          id="newPassword"
          type="password"
          value={form.newPassword}
          onChange={update('newPassword')}
          required
        />
        <p className="field-hint">8-16 characters, one uppercase letter, one special character</p>

        <label htmlFor="confirmNewPassword">Confirm new password</label>
        <input
          id="confirmNewPassword"
          type="password"
          value={form.confirmNewPassword}
          onChange={update('confirmNewPassword')}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

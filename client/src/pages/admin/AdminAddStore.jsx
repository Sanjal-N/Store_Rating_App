import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminAddStore() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [owners, setOwners] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/admin/store-owners', token)
      .then((data) => setOwners(data.storeOwners))
      .catch((err) => setError(err.message));
  }, [token]);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.name.trim().length === 0) {
      setError('Store name is required.');
      return;
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.address.trim().length === 0 || form.address.trim().length > 400) {
      setError('Address is required and must be under 400 characters.');
      return;
    }
    if (!form.ownerId) {
      setError('Please select a store owner.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await api.post('/admin/stores', { ...form, ownerId: Number(form.ownerId) }, token);
      navigate('/admin/stores');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Add store</h1>
        {error && <p className="form-error">{error}</p>}

        <label htmlFor="name">Store name</label>
        <input id="name" value={form.name} onChange={update('name')} required />

        <label htmlFor="email">Store email</label>
        <input id="email" type="email" value={form.email} onChange={update('email')} required />

        <label htmlFor="address">Address</label>
        <textarea id="address" value={form.address} onChange={update('address')} required maxLength={400} />

        <label htmlFor="ownerId">Store owner</label>
        <select id="ownerId" value={form.ownerId} onChange={update('ownerId')} required>
          <option value="">Select an existing Store Owner...</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name} ({owner.email})
            </option>
          ))}
        </select>
        {owners.length === 0 && (
          <p className="field-hint">
            No Store Owner accounts exist yet. Create one from the Add User page first.
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create store'}
        </button>
      </form>
    </div>
  );
}

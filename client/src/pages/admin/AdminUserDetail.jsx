import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RatingStamp from '../../components/RatingStamp';
import '../../styles/Dashboard.css';

export default function AdminUserDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/admin/users/${id}`, token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id, token]);

  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <p className="page-status">Loading user...</p>;

  const { user, store } = data;

  return (
    <div className="page">
      <Link to="/admin/users">&larr; Back to users</Link>
      <h1>{user.name}</h1>

      <dl className="detail-list">
        <dt>Email</dt>
        <dd className="mono-cell">{user.email}</dd>
        <dt>Address</dt>
        <dd>{user.address}</dd>
        <dt>Role</dt>
        <dd>
          <span className={`role-tag role-${user.role}`}>{user.role.replace('_', ' ')}</span>
        </dd>
      </dl>

      {user.role === 'store_owner' && (
        <>
          <h2>Store</h2>
          {store ? (
            <dl className="detail-list">
              <dt>Store name</dt>
              <dd>{store.name}</dd>
              <dt>Rating on record</dt>
              <dd>
                <RatingStamp value={store.average_rating} count={store.rating_count} />
              </dd>
            </dl>
          ) : (
            <p className="page-status">This store owner has no store linked to their account yet.</p>
          )}
        </>
      )}
    </div>
  );
}

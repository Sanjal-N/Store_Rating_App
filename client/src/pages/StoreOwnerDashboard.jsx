import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RatingStamp from '../components/RatingStamp';
import SortableTh from '../components/SortableTh';
import '../styles/Dashboard.css';

const SORT_ACCESSORS = {
  name: (r) => r.user_name.toLowerCase(),
  email: (r) => r.user_email.toLowerCase(),
  rating: (r) => r.rating,
  date: (r) => new Date(r.created_at).getTime(),
};

export default function StoreOwnerDashboard() {
  const { token } = useAuth();
  const [store, setStore] = useState(null);
  const [raters, setRaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    api
      .get('/store-owner/dashboard', token)
      .then((data) => {
        setStore(data.store);
        setRaters(data.raters);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const sortedRaters = useMemo(() => {
    const accessor = SORT_ACCESSORS[sortBy] || SORT_ACCESSORS.date;
    const sorted = [...raters].sort((a, b) => {
      const aVal = accessor(a);
      const bVal = accessor(b);
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }, [raters, sortBy, sortOrder]);

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  if (loading) return <p className="page-status">Opening the ledger...</p>;
  if (error) return <p className="form-error">{error}</p>;

  if (!store) {
    return (
      <div className="page">
        <h1>Store dashboard</h1>
        <p className="page-status">
          No store is linked to your account yet. An administrator needs to create one and assign you as
          owner.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{store.name}</h1>
        <RatingStamp value={store.average_rating} count={store.rating_count} />
      </div>

      <h2>Entries on your store</h2>
      {raters.length === 0 ? (
        <p className="page-status">No one has rated your store yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Email" field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Rating" field="rating" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Date" field="date" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sortedRaters.map((r, idx) => (
              <tr key={idx}>
                <td>{r.user_name}</td>
                <td className="mono-cell">{r.user_email}</td>
                <td className="mono-cell">{r.rating} / 5</td>
                <td className="mono-cell">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

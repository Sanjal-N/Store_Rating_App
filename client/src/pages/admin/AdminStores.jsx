import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SortableTh from '../../components/SortableTh';
import RatingStamp from '../../components/RatingStamp';
import '../../styles/Tables.css';

export default function AdminStores() {
  const { token } = useAuth();
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStores = useCallback(
    async (currentFilters, currentSortBy, currentSortOrder) => {
      setLoading(true);
      const params = new URLSearchParams({ sortBy: currentSortBy, sortOrder: currentSortOrder });
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      try {
        const data = await api.get(`/stores?${params.toString()}`, token);
        setStores(data.stores);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const timeout = setTimeout(() => loadStores(filters, sortBy, sortOrder), 350);
    return () => clearTimeout(timeout);
  }, [filters, sortBy, sortOrder, loadStores]);

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stores</h1>
        <Link className="btn-link" to="/admin/stores/new">
          + Add store
        </Link>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Filter by name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        />
        <input
          placeholder="Filter by email"
          value={filters.email}
          onChange={(e) => setFilters({ ...filters, email: e.target.value })}
        />
        <input
          placeholder="Filter by address"
          value={filters.address}
          onChange={(e) => setFilters({ ...filters, address: e.target.value })}
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="page-status">Reading the ledger...</p>}
      {!loading && stores.length === 0 && (
        <p className="page-status">No stores on record yet — add the first one.</p>
      )}

      {!loading && stores.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Email" field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Address" field="address" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Rating" field="rating" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td className="mono-cell">{s.email}</td>
                <td>{s.address}</td>
                <td>
                  <RatingStamp value={s.average_rating} count={s.rating_count} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

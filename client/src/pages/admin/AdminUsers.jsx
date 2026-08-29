import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SortableTh from '../../components/SortableTh';
import '../../styles/Tables.css';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(
    async (currentFilters, currentSortBy, currentSortOrder) => {
      setLoading(true);
      const params = new URLSearchParams({ sortBy: currentSortBy, sortOrder: currentSortOrder });
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      try {
        const data = await api.get(`/admin/users?${params.toString()}`, token);
        setUsers(data.users);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const timeout = setTimeout(() => loadUsers(filters, sortBy, sortOrder), 350);
    return () => clearTimeout(timeout);
  }, [filters, sortBy, sortOrder, loadUsers]);

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
        <h1>Users</h1>
        <Link className="btn-link" to="/admin/users/new">
          + Add user
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
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">Normal User</option>
          <option value="store_owner">Store Owner</option>
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="page-status">Reading the ledger...</p>}
      {!loading && users.length === 0 && (
        <p className="page-status">No users on record yet — add the first one.</p>
      )}

      {!loading && users.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Email" field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Address" field="address" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <SortableTh label="Role" field="role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link to={`/admin/users/${u.id}`}>{u.name}</Link>
                </td>
                <td className="mono-cell">{u.email}</td>
                <td>{u.address}</td>
                <td>
                  <span className={`role-tag role-${u.role}`}>{u.role.replace('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

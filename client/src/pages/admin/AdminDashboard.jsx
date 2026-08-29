import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Dashboard.css';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard', token)
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <p className="form-error">{error}</p>;
  if (!stats) return <p className="page-status">Opening the ledger...</p>;

  return (
    <div className="page">
      <h1>Ledger summary</h1>
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Users on record</span>
          <span className="stat-value">{stats.totalUsers}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Stores on record</span>
          <span className="stat-value">{stats.totalStores}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ratings submitted</span>
          <span className="stat-value">{stats.totalRatings}</span>
        </div>
      </div>
    </div>
  );
}

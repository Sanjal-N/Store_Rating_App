import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  const roleLabel = { admin: 'Administrator', user: 'Member', store_owner: 'Proprietor' }[user.role];

  return (
    <header className="navbar">
      <div className="navbar-top">
        <div className="navbar-brand">
          <span className="navbar-mark">No. 1</span>
          Store Rating Ledger
        </div>
        <div className="navbar-user">
          <span className="navbar-user-name">{user.name}</span>
          <span className="navbar-user-role">{roleLabel}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </div>
      <nav className="navbar-links">
        {user.role === 'admin' && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/stores">Stores</Link>
          </>
        )}
        {user.role === 'user' && <Link to="/stores">Stores</Link>}
        {user.role === 'store_owner' && <Link to="/store-owner">Dashboard</Link>}
        <Link to="/profile/password">Change password</Link>
      </nav>
    </header>
  );
}

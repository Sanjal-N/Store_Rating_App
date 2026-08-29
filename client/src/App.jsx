import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ChangePassword from './pages/ChangePassword';
import StoreList from './pages/StoreList';
import StoreOwnerDashboard from './pages/StoreOwnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminAddUser from './pages/admin/AdminAddUser';
import AdminStores from './pages/admin/AdminStores';
import AdminAddStore from './pages/admin/AdminAddStore';

const ROLE_HOME = { admin: '/admin', user: '/stores', store_owner: '/store-owner' };

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/profile/password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Normal User */}
        <Route
          path="/stores"
          element={
            <ProtectedRoute roles={['user']}>
              <StoreList />
            </ProtectedRoute>
          }
        />

        {/* Store Owner */}
        <Route
          path="/store-owner"
          element={
            <ProtectedRoute roles={['store_owner']}>
              <StoreOwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminAddUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stores"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminStores />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stores/new"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminAddStore />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<p className="page-status">Page not found.</p>} />
      </Routes>
    </>
  );
}

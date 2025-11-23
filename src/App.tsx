import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { USER_ROLES } from './utils/constants';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Elections } from './pages/Elections';
import { ActiveElections } from './pages/ActiveElections';
import { ElectionVote } from './pages/ElectionVote';
import { Results } from './pages/Results';

// Admin Pages
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ElectionsList } from './pages/Admin/ElectionsList';
import { CreateElection } from './pages/Admin/CreateElection';
import { EditElection } from './pages/Admin/EditElection';
import { VoteSimulator } from './pages/Admin/VoteSimulator';
import { UserManagement } from './pages/Admin/UserManagement';

// Route Protection Components
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.roles.includes(USER_ROLES.ADMINISTRATOR)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Private Routes */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/elections" element={
        <PrivateRoute>
          <Elections />
        </PrivateRoute>
      } />
      <Route path="/active-elections" element={
        <PrivateRoute>
          <ActiveElections />
        </PrivateRoute>
      } />
      <Route path="/elections/:id/vote" element={
        <PrivateRoute>
          <ElectionVote />
        </PrivateRoute>
      } />
      <Route path="/results/:id" element={
        <PrivateRoute>
          <Results />
        </PrivateRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      <Route path="/admin/elections" element={
        <AdminRoute>
          <ElectionsList />
        </AdminRoute>
      } />
      <Route path="/admin/elections/new" element={
        <AdminRoute>
          <CreateElection />
        </AdminRoute>
      } />
      <Route path="/admin/elections/:id/edit" element={
        <AdminRoute>
          <EditElection />
        </AdminRoute>
      } />
      <Route path="/admin/vote-simulator" element={
        <AdminRoute>
          <VoteSimulator />
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-900 text-white">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#374151',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
// Terminal Pulse - Step 8: Main App Component with Routing

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import components (we'll create these in subsequent steps)
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Terminals from './pages/Terminals';
import SupportTickets from './pages/SupportTickets';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Private Route Component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

// Role-based Route Component
interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Current role: <span className="font-medium">{currentUser.role}</span>
          </p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Routes Configuration
const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />

      {/* Private Routes - All authenticated users */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/terminals" 
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Terminals />
            </DashboardLayout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/support-tickets" 
        element={
          <PrivateRoute>
            <DashboardLayout>
              <SupportTickets />
            </DashboardLayout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/analytics" 
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/reports" 
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </PrivateRoute>
        } 
      />

      {/* Admin and Manager Only Routes */}
      <Route 
        path="/user-management" 
        element={
          <PrivateRoute>
            <RoleBasedRoute allowedRoles={['Administrator', 'Service Desk Manager']}>
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            </RoleBasedRoute>
          </PrivateRoute>
        } 
      />

      {/* Default redirect */}
      <Route 
        path="/" 
        element={
          <Navigate to={currentUser ? "/dashboard" : "/login"} replace />
        } 
      />

      {/* 404 Page */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">404</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
              <p className="text-gray-600 mb-4">
                The page you're looking for doesn't exist.
              </p>
              <button 
                onClick={() => window.history.back()}
                className="btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        } 
      />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="App">
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </div>
    </ErrorBoundary>
  );
};

export default App;
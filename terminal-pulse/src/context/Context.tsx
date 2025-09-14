// Terminal Pulse - Step 6: Authentication Context

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { localStorageService } from '../services/localStorage';

// Auth State
interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    
    case 'LOGIN_SUCCESS':
      return { ...state, currentUser: action.payload, loading: false, error: null };
    
    case 'LOGIN_FAILURE':
      return { ...state, currentUser: null, loading: false, error: action.payload };
    
    case 'LOGOUT':
      return { ...state, currentUser: null, loading: false, error: null };
    
    case 'UPDATE_USER':
      return { ...state, currentUser: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Initial State
const initialState: AuthState = {
  currentUser: null,
  loading: false,
  error: null
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permission mappings by role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Administrator': [
    'view_all_terminals',
    'manage_terminals',
    'view_all_tickets',
    'manage_tickets',
    'view_analytics',
    'generate_reports',
    'manage_users',
    'system_admin'
  ],
  'Service Desk Manager': [
    'view_all_terminals',
    'view_all_tickets',
    'manage_tickets',
    'view_analytics',
    'generate_reports',
    'manage_users'
  ],
  'Support Agent': [
    'view_all_terminals',
    'manage_terminals',
    'view_all_tickets',
    'manage_tickets',
    'view_analytics',
    'generate_reports'
  ],
  'Merchant': [
    'view_own_terminals',
    'view_own_tickets',
    'create_tickets',
    'view_own_analytics'
  ]
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorageService.getCurrentUser();
    if (savedUser) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: savedUser });
    }
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Find user by username
      const user = localStorageService.getUserByUsername(username);
      
      if (!user) {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'User not found' });
        return false;
      }

      // Check if account is locked
      if (user.status === 'Locked') {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Account is locked. Contact administrator.' });
        return false;
      }

      // Verify password (in real app, this would be hashed comparison)
      if (user.password !== password) {
        // Increment failed attempts
        const updatedUser = localStorageService.updateUser(user.id, {
          failedLoginAttempts: user.failedLoginAttempts + 1
        });

        // Lock account after 3 failed attempts
        if (updatedUser && updatedUser.failedLoginAttempts >= 3) {
          localStorageService.updateUser(user.id, { status: 'Locked' });
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Account locked due to multiple failed login attempts.' });
        } else {
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid password' });
        }
        return false;
      }

      // Successful login - update last login and reset failed attempts
      const updatedUser = localStorageService.updateUser(user.id, {
        lastLogin: new Date(),
        failedLoginAttempts: 0
      });

      if (updatedUser) {
        localStorageService.setCurrentUser(updatedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
        return true;
      }

      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed' });
      return false;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed. Please try again.' });
      return false;
    }
  };

  // Logout function
  const logout = (): void => {
    localStorageService.setCurrentUser(null);
    dispatch({ type: 'LOGOUT' });
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!state.currentUser) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[state.currentUser.role] || [];
    return rolePermissions.includes(permission);
  };

  // Update current user data
  const updateCurrentUser = (updates: Partial<User>): void => {
    if (!state.currentUser) return;

    const updatedUser = localStorageService.updateUser(state.currentUser.id, updates);
    if (updatedUser) {
      localStorageService.setCurrentUser(updatedUser);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    }
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Helper functions to check specific roles
  const isAdmin = (): boolean => state.currentUser?.role === 'Administrator';
  const isManager = (): boolean => state.currentUser?.role === 'Service Desk Manager';
  const isSupport = (): boolean => state.currentUser?.role === 'Support Agent';
  const isMerchant = (): boolean => state.currentUser?.role === 'Merchant';

  // Helper to get accessible terminals for current user
  const getAccessibleTerminals = () => {
    if (!state.currentUser) return [];
    
    if (state.currentUser.role === 'Merchant') {
      return localStorageService.getTerminalsByUser(state.currentUser.id);
    }
    
    return localStorageService.getTerminals();
  };

  // Helper to get accessible tickets for current user
  const getAccessibleTickets = () => {
    if (!state.currentUser) return [];
    return localStorageService.getTicketsByUser(state.currentUser.id);
  };

  const value: AuthContextType = {
    currentUser: state.currentUser,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    hasPermission,
    updateCurrentUser,
    clearError,
    // Helper methods
    isAdmin,
    isManager,
    isSupport,
    isMerchant,
    getAccessibleTerminals,
    getAccessibleTickets
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission, 
  requiredRole,
  fallback 
}) => {
  const { currentUser, hasPermission } = useAuth();

  // Not authenticated
  if (!currentUser) {
    return fallback || <div>Please log in to access this page.</div>;
  }

  // Check role requirement
  if (requiredRole && currentUser.role !== requiredRole) {
    return fallback || <div>Access denied. Insufficient permissions.</div>;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <div>Access denied. Insufficient permissions.</div>;
  }

  return <>{children}</>;
};
// Terminal Pulse - Step 10: Login Page Component

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Demo accounts for easy testing
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Get redirect path from location state
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Clear error when component unmounts or form changes
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    if (formData.username || formData.password) {
      clearError();
    }
  }, [formData.username, formData.password, clearError]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      return;
    }

    const success = await login(formData.username, formData.password);
    
    if (success) {
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('terminal_pulse_remember', formData.username);
      } else {
        localStorage.removeItem('terminal_pulse_remember');
      }
      
      // Navigate to intended destination
      navigate(from, { replace: true });
    }
  };

  // Quick login function for demo accounts
  const handleDemoLogin = async (username: string, password: string) => {
    setFormData({ username, password });
    const success = await login(username, password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  // Load remembered username on mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('terminal_pulse_remember');
    if (rememberedUser) {
      setFormData(prev => ({ ...prev, username: rememberedUser }));
      setRememberMe(true);
    }
  }, []);

  const demoAccounts = [
    { 
      username: 'admin.mukamuri', 
      password: 'admin123', 
      role: 'Administrator', 
      name: 'Tendai Mukamuri',
      description: 'Full system access'
    },
    { 
      username: 'servicedesk.manager', 
      password: 'manager123', 
      role: 'Service Desk Manager', 
      name: 'Sarah Chigumba',
      description: 'Management level access'
    },
    { 
      username: 'support.nhongo', 
      password: 'support123', 
      role: 'Support Agent', 
      name: 'Chipo Nhongo',
      description: 'Support operations'
    },
    { 
      username: 'merchant.mutasa', 
      password: 'merchant123', 
      role: 'Merchant', 
      name: 'Tafadzwa Mutasa',
      description: 'Own terminals only'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Terminal Pulse</h2>
          <p className="mt-2 text-gray-600">Sign in to access the POS monitoring platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="input pl-10"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember username
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Accounts Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
            </button>

            {showDemoAccounts && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-500 mb-3">
                  Click any account below to login instantly for testing:
                </p>
                {demoAccounts.map((account, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleDemoLogin(account.username, account.password)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{account.name}</div>
                        <div className="text-xs text-gray-500">{account.role}</div>
                        <div className="text-xs text-gray-400">{account.description}</div>
                      </div>
                      <div className="text-xs bg-white px-2 py-1 rounded border">
                        Click to login
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 Stanbic Bank. Terminal Pulse Platform.</p>
          <p className="mt-1">Secure access to POS monitoring system</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
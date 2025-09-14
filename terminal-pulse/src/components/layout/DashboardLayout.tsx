// Terminal Pulse - Fixed Dashboard Layout Component

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Monitor, 
  Headphones, 
  BarChart3, 
  FileText, 
  Users, 
  LogOut,
  Bell,
  Settings,
  Shield,
  ChevronDown,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { localStorageService } from '../../services/localStorage';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  permission?: string;
  roles?: string[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Navigation items with role-based access
  const navigation: NavItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home 
    },
    { 
      name: 'Terminals', 
      href: '/terminals', 
      icon: Monitor 
    },
    { 
      name: 'Support Tickets', 
      href: '/support-tickets', 
      icon: Headphones 
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: BarChart3 
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: FileText 
    },
    { 
      name: 'User Management', 
      href: '/user-management', 
      icon: Users,
      roles: ['Administrator', 'Service Desk Manager']
    }
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return currentUser && item.roles.includes(currentUser.role);
  });

  // Get alerts count
  const alerts = localStorageService.getAlerts();
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged).length;

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if current route is active
  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Service Desk Manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Support Agent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Merchant':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!currentUser) {
    return null;
  }

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4 mb-8">
        <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="font-bold text-lg text-gray-900">Terminal Pulse</div>
          <div className="text-xs text-gray-500">POS Monitoring Platform</div>
        </div>
      </div>

      {/* Current user info */}
      <div className="px-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">
                {currentUser.fullName}
              </div>
              <div className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg cursor-pointer transition-colors duration-200 w-full text-left ${
                isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : ''
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2025 Stanbic Bank Zimbabwe
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 flex z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm">
          {/* Mobile menu button */}
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Header content */}
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                {filteredNavigation.find(item => isActiveRoute(item.href))?.name || 'Terminal Pulse'}
              </h1>
            </div>

            {/* Right side of header */}
            <div className="flex items-center space-x-4">
              {/* Alerts */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                  {unacknowledgedAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unacknowledgedAlerts}
                    </span>
                  )}
                </button>
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="font-medium text-gray-900">{currentUser.fullName}</div>
                      <div className="text-xs text-gray-500">{currentUser.role}</div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {/* User menu dropdown */}
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{currentUser.fullName}</div>
                        <div className="text-xs text-gray-500">{currentUser.email}</div>
                      </div>
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
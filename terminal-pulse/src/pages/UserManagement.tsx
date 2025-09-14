// Terminal Pulse - Step 17: User Management Page (Admin/Manager Only)

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  User,
  Mail,
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Download,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStorageService } from '../services/localStorage';
import { User as UserType, UserRole } from '../types';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';

const UserManagement: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Locked' | 'All'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null
  });

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Support Agent' as UserRole,
    status: 'Active' as 'Active' | 'Locked'
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Load users data
  useEffect(() => {
    const loadUsers = () => {
      setLoading(true);
      try {
        const userData = localStorageService.getUsers();
        setUsers(userData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Calculate user statistics
  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'Active').length;
    const locked = users.filter(u => u.status === 'Locked').length;
    const admins = users.filter(u => u.role === 'Administrator').length;
    const agents = users.filter(u => u.role === 'Support Agent').length;
    const managers = users.filter(u => u.role === 'Service Desk Manager').length;
    const merchants = users.filter(u => u.role === 'Merchant').length;
    
    return { total, active, locked, admins, agents, managers, merchants };
  }, [users]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newUserForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!newUserForm.username.trim()) {
      errors.username = 'Username is required';
    } else if (users.some(u => u.username === newUserForm.username && (!editingUser || u.id !== editingUser.id))) {
      errors.username = 'Username already exists';
    }

    if (!newUserForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email)) {
      errors.email = 'Invalid email format';
    } else if (users.some(u => u.email === newUserForm.email && (!editingUser || u.id !== editingUser.id))) {
      errors.email = 'Email already exists';
    }

    if (!editingUser) { // Only validate password for new users
      if (!newUserForm.password) {
        errors.password = 'Password is required';
      } else if (newUserForm.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (newUserForm.password !== newUserForm.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmitUser = () => {
    if (!validateForm()) return;

    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = localStorageService.updateUser(editingUser.id, {
          fullName: newUserForm.fullName,
          username: newUserForm.username,
          email: newUserForm.email,
          role: newUserForm.role,
          status: newUserForm.status
        });

        if (updatedUser) {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
        }
      } else {
        // Create new user
        const newUser = localStorageService.createUser({
          fullName: newUserForm.fullName,
          username: newUserForm.username,
          email: newUserForm.email,
          password: newUserForm.password,
          role: newUserForm.role,
          status: newUserForm.status,
          failedLoginAttempts: 0,
          lastLogin: null
        });

        setUsers(prev => [newUser, ...prev]);
      }

      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setNewUserForm({
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Support Agent',
      status: 'Active'
    });
    setFormErrors({});
    setShowPassword(false);
  };

  // Handle edit user
  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setNewUserForm({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      status: user.status
    });
    setShowCreateModal(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    setDeleteConfirm({ isOpen: true, userId });
  };

  const confirmDeleteUser = () => {
    if (deleteConfirm.userId) {
      const success = localStorageService.deleteUser(deleteConfirm.userId);
      if (success) {
        setUsers(prev => prev.filter(u => u.id !== deleteConfirm.userId));
      }
    }
    setDeleteConfirm({ isOpen: false, userId: null });
  };

  // Handle lock/unlock user
  const handleToggleUserStatus = (userId: string, currentStatus: 'Active' | 'Locked') => {
    const newStatus = currentStatus === 'Active' ? 'Locked' : 'Active';
    const updatedUser = localStorageService.updateUser(userId, { status: newStatus });
    
    if (updatedUser) {
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    }
  };

  // Export users data
  const handleExportUsers = () => {
    const csvContent = [
      ['Full Name', 'Username', 'Email', 'Role', 'Status', 'Last Login', 'Failed Attempts'],
      ...filteredUsers.map(user => [
        user.fullName,
        user.username,
        user.email,
        user.role,
        user.status,
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
        user.failedLoginAttempts.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'Service Desk Manager':
        return 'text-purple-700 bg-purple-100 border-purple-200';
      case 'Support Agent':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'Merchant':
        return 'text-green-700 bg-green-100 border-green-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Create Administrator and Support Agent users</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportUsers}
            className="btn-outline flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          {hasPermission('manage_users') && (
            <button
              onClick={() => {
                resetForm();
                setEditingUser(null);
                setShowCreateModal(true);
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New User
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-blue-600">{userStats.total}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-red-600">{userStats.locked}</div>
          <div className="text-sm text-gray-500">Locked</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-purple-600">{userStats.admins}</div>
          <div className="text-sm text-gray-500">Administrators</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-blue-600">{userStats.agents}</div>
          <div className="text-sm text-gray-500">Support Agents</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{userStats.merchants}</div>
          <div className="text-sm text-gray-500">Merchants</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              className="select w-full"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'All')}
            >
              <option value="All">All Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="Service Desk Manager">Service Desk Manager</option>
              <option value="Support Agent">Support Agent</option>
              <option value="Merchant">Merchant</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="select w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'Active' | 'Locked' | 'All')}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Locked">Locked</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Failed Attempts</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-gray-900">{user.username}</div>
                    </td>
                    <td>
                      <div className="flex items-center text-gray-500">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center">
                        {user.status === 'Active' ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <Lock className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <Badge variant={user.status === 'Active' ? 'online' : 'offline'}>
                          {user.status}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      {user.failedLoginAttempts > 0 ? (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {user.failedLoginAttempts}
                        </div>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {hasPermission('manage_users') && (
                          <>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1 text-gray-400 hover:text-primary-600"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.status)}
                              className={`p-1 hover:text-yellow-600 ${user.status === 'Active' ? 'text-gray-400' : 'text-red-400'}`}
                              title={user.status === 'Active' ? 'Lock User' : 'Unlock User'}
                            >
                              {user.status === 'Active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-lg font-medium text-gray-900 mb-2">No users found</div>
                    <div>Try adjusting your search or filter criteria</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className={`input w-full ${formErrors.fullName ? 'border-red-300' : ''}`}
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                  {formErrors.fullName && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    className={`input w-full ${formErrors.username ? 'border-red-300' : ''}`}
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                  {formErrors.username && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className={`input w-full ${formErrors.email ? 'border-red-300' : ''}`}
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                  {formErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Password (only for new users) */}
                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`input w-full pr-10 ${formErrors.password ? 'border-red-300' : ''}`}
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                      {formErrors.password && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        className={`input w-full ${formErrors.confirmPassword ? 'border-red-300' : ''}`}
                        value={newUserForm.confirmPassword}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                      {formErrors.confirmPassword && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.confirmPassword}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    className="select w-full"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  >
                    <option value="Support Agent">Support Agent</option>
                    <option value="Service Desk Manager">Service Desk Manager</option>
                    <option value="Merchant">Merchant</option>
                    {currentUser?.role === 'Administrator' && (
                      <option value="Administrator">Administrator</option>
                    )}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Status
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="Active"
                        checked={newUserForm.status === 'Active'}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, status: e.target.value as 'Active' }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="Locked"
                        checked={newUserForm.status === 'Locked'}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, status: e.target.value as 'Locked' }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Locked</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto sm:ml-3"
                  onClick={handleSubmitUser}
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  className="btn-outline mt-3 w-full sm:mt-0 sm:w-auto"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null })}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default UserManagement;
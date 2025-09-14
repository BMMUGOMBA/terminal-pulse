// Terminal Pulse - Step 13: Terminals Management Page

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCw, 
  Eye, 
  MapPin, 
  Clock, 
  Wifi,
  WifiOff,
  Settings,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStorageService } from '../services/localStorage';
import { Terminal, TerminalStatus } from '../types';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';

const Terminals: React.FC = () => {
  const { currentUser, getAccessibleTerminals, hasPermission } = useAuth();
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TerminalStatus | 'All'>('All');
  const [selectedTerminals, setSelectedTerminals] = useState<string[]>([]);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [terminalToRestart, setTerminalToRestart] = useState<string | null>(null);

  // Load terminals data
  useEffect(() => {
    const loadTerminals = () => {
      setLoading(true);
      try {
        const terminalData = getAccessibleTerminals();
        setTerminals(terminalData);
      } catch (error) {
        console.error('Error loading terminals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTerminals();

    // Set up real-time updates
    const interval = setInterval(loadTerminals, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [getAccessibleTerminals]);

  // Filter and search terminals
  const filteredTerminals = useMemo(() => {
    return terminals.filter(terminal => {
      const matchesSearch = 
        terminal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        terminal.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        terminal.merchant.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || terminal.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [terminals, searchTerm, statusFilter]);

  // Calculate summary statistics
  const terminalStats = useMemo(() => {
    const total = terminals.length;
    const online = terminals.filter(t => t.status === 'Online').length;
    const offline = terminals.filter(t => t.status === 'Offline').length;
    const maintenance = terminals.filter(t => t.status === 'Maintenance').length;
    const error = terminals.filter(t => t.status === 'Error').length;
    
    return { total, online, offline, maintenance, error };
  }, [terminals]);

  // Handle terminal restart
  const handleRestartTerminal = (terminalId: string) => {
    setTerminalToRestart(terminalId);
    setRestartDialogOpen(true);
  };

  const confirmRestart = () => {
    if (terminalToRestart) {
      // Simulate restart process
      const updatedTerminal = localStorageService.updateTerminal(terminalToRestart, {
        status: 'Maintenance' as TerminalStatus,
        lastSeen: new Date()
      });
      
      if (updatedTerminal) {
        setTerminals(prev => prev.map(t => 
          t.id === terminalToRestart ? updatedTerminal : t
        ));
        
        // Simulate terminal coming back online after 30 seconds
        setTimeout(() => {
          const onlineTerminal = localStorageService.updateTerminal(terminalToRestart, {
            status: 'Online' as TerminalStatus,
            lastSeen: new Date()
          });
          if (onlineTerminal) {
            setTerminals(prev => prev.map(t => 
              t.id === terminalToRestart ? onlineTerminal : t
            ));
          }
        }, 30000);
      }
    }
    setRestartDialogOpen(false);
    setTerminalToRestart(null);
  };

  // Handle bulk actions
  const handleBulkRestart = () => {
    selectedTerminals.forEach(terminalId => {
      localStorageService.updateTerminal(terminalId, {
        status: 'Maintenance' as TerminalStatus,
        lastSeen: new Date()
      });
    });
    setSelectedTerminals([]);
    // Refresh data
    setTerminals(getAccessibleTerminals());
  };

  // Toggle terminal selection
  const toggleTerminalSelection = (terminalId: string) => {
    setSelectedTerminals(prev => 
      prev.includes(terminalId)
        ? prev.filter(id => id !== terminalId)
        : [...prev, terminalId]
    );
  };

  // Select all filtered terminals
  const handleSelectAll = () => {
    if (selectedTerminals.length === filteredTerminals.length) {
      setSelectedTerminals([]);
    } else {
      setSelectedTerminals(filteredTerminals.map(t => t.id));
    }
  };

  // Format last seen time
  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(lastSeen).getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Get status icon
  const getStatusIcon = (status: TerminalStatus) => {
    switch (status) {
      case 'Online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'Maintenance':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'Error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  // Export terminals data
  const handleExport = () => {
    const csvContent = [
      ['Terminal ID', 'Location', 'Merchant', 'Status', 'Uptime', 'Last Seen'],
      ...filteredTerminals.map(terminal => [
        terminal.id,
        terminal.location,
        terminal.merchant,
        terminal.status,
        `${terminal.uptime}%`,
        new Date(terminal.lastSeen).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading terminals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminals</h1>
          <p className="text-gray-600 mt-1">Monitor and manage POS terminal status</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedTerminals.length > 0 && hasPermission('manage_terminals') && (
            <button
              onClick={handleBulkRestart}
              className="btn-secondary flex items-center"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Restart Selected ({selectedTerminals.length})
            </button>
          )}
          <button
            onClick={handleExport}
            className="btn-outline flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">{terminalStats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <div className="text-2xl font-bold text-green-900">{terminalStats.online}</div>
              <div className="text-sm text-gray-500">Online</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <WifiOff className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <div className="text-2xl font-bold text-red-900">{terminalStats.offline}</div>
              <div className="text-sm text-gray-500">Offline</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <div className="text-2xl font-bold text-blue-900">{terminalStats.maintenance}</div>
              <div className="text-sm text-gray-500">Maintenance</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <div className="text-2xl font-bold text-orange-900">{terminalStats.error}</div>
              <div className="text-sm text-gray-500">Error</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search terminals by ID, location, or merchant..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                className="select pl-10 w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TerminalStatus | 'All')}
              >
                <option value="All">All Status</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Error">Error</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing {filteredTerminals.length} of {terminals.length} terminals
            {searchTerm && (
              <span className="ml-1">
                matching "<span className="font-medium text-gray-700">{searchTerm}</span>"
              </span>
            )}
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Terminals Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedTerminals.length === filteredTerminals.length && filteredTerminals.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Terminal ID</th>
                <th>Location</th>
                <th>Merchant</th>
                <th>Status</th>
                <th>Uptime</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerminals.length > 0 ? (
                filteredTerminals.map((terminal) => (
                  <tr key={terminal.id} className="hover:bg-gray-50">
                    <td>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedTerminals.includes(terminal.id)}
                        onChange={() => toggleTerminalSelection(terminal.id)}
                      />
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">{terminal.id}</div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{terminal.location}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-gray-900">{terminal.merchant}</div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        {getStatusIcon(terminal.status)}
                        <Badge
                          variant={terminal.status.toLowerCase() as any}
                          className="ml-2"
                        >
                          {terminal.status}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              terminal.uptime >= 95 ? 'bg-green-500' :
                              terminal.uptime >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(terminal.uptime, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{terminal.uptime.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatLastSeen(terminal.lastSeen)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {hasPermission('manage_terminals') && (
                          <button
                            onClick={() => handleRestartTerminal(terminal.id)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Restart Terminal"
                            disabled={terminal.status === 'Maintenance'}
                          >
                            <RotateCw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    {searchTerm || statusFilter !== 'All' ? (
                      <div>
                        <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <div className="text-lg font-medium text-gray-900 mb-2">No terminals found</div>
                        <div>Try adjusting your search or filter criteria</div>
                      </div>
                    ) : (
                      <div>
                        <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <div className="text-lg font-medium text-gray-900 mb-2">No terminals available</div>
                        <div>Terminal data will appear here when available</div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={restartDialogOpen}
        onClose={() => setRestartDialogOpen(false)}
        onConfirm={confirmRestart}
        title="Restart Terminal"
        message={`Are you sure you want to restart terminal ${terminalToRestart}? This will temporarily interrupt service.`}
        confirmText="Restart"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default Terminals;
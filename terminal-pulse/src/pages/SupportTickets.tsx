// Terminal Pulse - Step 14: Support Tickets Management Page

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  UserPlus, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
  Monitor,
  MessageSquare,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStorageService } from '../services/localStorage';
import { SupportTicket, TicketStatus, TicketPriority, TicketSource, Terminal, User as UserType } from '../types';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';

const SupportTickets: React.FC = () => {
  const { currentUser, getAccessibleTickets, hasPermission } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All'>('All');
  const [agentFilter, setAgentFilter] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      try {
        setTickets(getAccessibleTickets());
        setTerminals(localStorageService.getTerminals());
        setUsers(localStorageService.getUsers());
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [getAccessibleTickets]);

  // Filter and search tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const terminal = terminals.find(t => t.id === ticket.terminalId);
      const assignedUser = users.find(u => u.id === ticket.assignedTo);
      
      const matchesSearch = 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.terminalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        terminal?.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        terminal?.merchant.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
      const matchesAgent = agentFilter === 'All' || ticket.assignedTo === agentFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesAgent;
    });
  }, [tickets, terminals, users, searchTerm, statusFilter, priorityFilter, agentFilter]);

  // Calculate ticket statistics
  const ticketStats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Open').length;
    const inProgress = tickets.filter(t => t.status === 'In Progress').length;
    const resolved = tickets.filter(t => t.status === 'Resolved').length;
    const scheduled = tickets.filter(t => t.status === 'Scheduled').length;
    const breached = tickets.filter(t => t.slaBreach).length;
    
    return { total, open, inProgress, resolved, scheduled, breached };
  }, [tickets]);

  // Get support agents for filter dropdown
  const supportAgents = useMemo(() => {
    return users.filter(user => 
      ['Support Agent', 'Service Desk Manager', 'Administrator'].includes(user.role)
    );
  }, [users]);

  // Handle ticket assignment
  const handleAssignTicket = (ticketId: string, userId: string) => {
    const updatedTicket = localStorageService.updateTicket(ticketId, {
      assignedTo: userId,
      status: 'In Progress' as TicketStatus
    });
    
    if (updatedTicket) {
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
    }
  };

  // Handle ticket status update
  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    const updates: Partial<SupportTicket> = { status: newStatus };
    
    if (newStatus === 'Resolved') {
      updates.resolvedAt = new Date();
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        updates.resolutionTime = Math.floor((new Date().getTime() - new Date(ticket.createdAt).getTime()) / 60000);
      }
    }
    
    const updatedTicket = localStorageService.updateTicket(ticketId, updates);
    
    if (updatedTicket) {
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
    }
  };

  // Create new ticket
  const handleCreateTicket = (ticketData: any) => {
    const newTicket = localStorageService.createTicket({
      ...ticketData,
      reportedBy: currentUser!.id,
      assignedTo: null,
      slaTarget: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      slaBreach: false,
      slaBreachDuration: 0
    });
    
    setTickets(prev => [newTicket, ...prev]);
    setShowCreateModal(false);
  };

  // Export tickets
  const handleExport = () => {
    const csvContent = [
      ['Ticket ID', 'Title', 'Terminal', 'Priority', 'Status', 'Source', 'Created', 'SLA Breach'],
      ...filteredTickets.map(ticket => {
        const terminal = terminals.find(t => t.id === ticket.terminalId);
        return [
          ticket.id,
          ticket.title,
          terminal ? `${terminal.id} - ${terminal.location}` : ticket.terminalId,
          ticket.priority,
          ticket.status,
          ticket.source,
          new Date(ticket.createdAt).toLocaleString(),
          ticket.slaBreach ? 'Yes' : 'No'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-tickets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Get priority color
  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'Open': return 'text-red-600 bg-red-50 border-red-200';
      case 'In Progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'Scheduled': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get source icon
  const getSourceIcon = (source: TicketSource) => {
    switch (source) {
      case 'System': return '🔧';
      case 'Merchant': return '📱';
      case 'Customer Call': return '📞';
      case 'WhatsApp': return '💬';
      case 'Email': return '📧';
      default: return '📋';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading support tickets..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage customer support requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="btn-outline flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          {hasPermission('manage_tickets') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{ticketStats.total}</div>
            <div className="text-sm text-gray-500">Total Tickets</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{ticketStats.open}</div>
            <div className="text-sm text-gray-500">Open</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{ticketStats.inProgress}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
            <div className="text-sm text-gray-500">Resolved</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{ticketStats.scheduled}</div>
            <div className="text-sm text-gray-500">Scheduled</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{ticketStats.breached}</div>
            <div className="text-sm text-gray-500">SLA Breach</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="select w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'All')}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              className="select w-full"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'All')}
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <select
              className="select w-full"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="All">All Agents</option>
              {supportAgents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title</th>
                <th>Terminal</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA</th>
                <th>Source</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => {
                  const terminal = terminals.find(t => t.id === ticket.terminalId);
                  const assignedUser = users.find(u => u.id === ticket.assignedTo);
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td>
                        <div className="font-medium text-gray-900">{ticket.id}</div>
                      </td>
                      <td>
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{ticket.title}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {terminal ? `${terminal.location} • ${terminal.merchant}` : ticket.terminalId}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Monitor className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium">{ticket.terminalId}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        {ticket.slaBreach ? (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">
                              +{Math.floor(ticket.slaBreachDuration / 60)}h
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">On Track</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center">
                          <span className="mr-1">{getSourceIcon(ticket.source)}</span>
                          <span className="text-sm">{ticket.source}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-500">
                          {formatTimeAgo(ticket.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {hasPermission('manage_tickets') && (
                            <>
                              <button
                                className="p-1 text-gray-400 hover:text-primary-600"
                                title="Edit Ticket"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {!ticket.assignedTo && (
                                <button
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Assign Ticket"
                                  onClick={() => setSelectedTicketId(ticket.id)}
                                >
                                  <UserPlus className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-lg font-medium text-gray-900 mb-2">No tickets found</div>
                    <div>Try adjusting your search or filter criteria</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Assignment Modal - Simple version for now */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setSelectedTicketId(null)}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Assign Ticket {selectedTicketId}
              </h3>
              <div className="space-y-3">
                {supportAgents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      handleAssignTicket(selectedTicketId, agent.id);
                      setSelectedTicketId(null);
                    }}
                    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 flex items-center"
                  >
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">{agent.fullName}</div>
                      <div className="text-sm text-gray-500">{agent.role}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="btn-outline w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
// Terminal Pulse - Step 12: Main Dashboard Page

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Monitor, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Clock,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { localStorageService } from '../services/localStorage';
import { Terminal, SupportTicket, PerformanceMetrics } from '../types';

const Dashboard: React.FC = () => {
  const { currentUser, getAccessibleTerminals, getAccessibleTickets } = useAuth();
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  // Load data on component mount
  useEffect(() => {
    setTerminals(getAccessibleTerminals());
    setTickets(getAccessibleTickets());
    setMetrics(localStorageService.getMetrics());

    // Simulate real-time updates (in production, this would be WebSocket or polling)
    const interval = setInterval(() => {
      setTerminals(getAccessibleTerminals());
      setTickets(getAccessibleTickets());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [getAccessibleTerminals, getAccessibleTickets]);

  // Calculate dashboard KPIs
  const dashboardData = useMemo(() => {
    const totalTerminals = terminals.length;
    const onlineTerminals = terminals.filter(t => t.status === 'Online').length;
    const offlineTerminals = terminals.filter(t => t.status === 'Offline').length;
    const maintenanceTerminals = terminals.filter(t => t.status === 'Maintenance').length;
    const errorTerminals = terminals.filter(t => t.status === 'Error').length;
    
    const onlinePercentage = totalTerminals > 0 ? Math.round((onlineTerminals / totalTerminals) * 100) : 0;
    
    // Calculate average uptime
    const avgUptime = totalTerminals > 0 
      ? Math.round(terminals.reduce((sum, t) => sum + t.uptime, 0) / totalTerminals) 
      : 0;

    // Ticket statistics
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
    const scheduledTickets = tickets.filter(t => t.status === 'Scheduled').length;

    // Calculate average resolution time from recent resolved tickets
    const recentResolvedTickets = tickets.filter(t => 
      t.status === 'Resolved' && t.resolutionTime
    );
    const avgResolutionTime = recentResolvedTickets.length > 0
      ? Math.round(recentResolvedTickets.reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / recentResolvedTickets.length / 60) // Convert to hours
      : 3.5;

    // SLA compliance calculation
    const totalSLATickets = tickets.filter(t => t.status !== 'Open').length;
    const slaCompliantTickets = tickets.filter(t => !t.slaBreach && t.status !== 'Open').length;
    const slaCompliance = totalSLATickets > 0 
      ? Math.round((slaCompliantTickets / totalSLATickets) * 100)
      : 94;

    // Issues detected (offline + error terminals)
    const issuesDetected = offlineTerminals + errorTerminals;

    return {
      totalTerminals,
      onlineTerminals,
      offlineTerminals,
      maintenanceTerminals,
      errorTerminals,
      onlinePercentage,
      avgUptime,
      avgResolutionTime,
      slaCompliance,
      issuesDetected,
      scheduledMaintenance: maintenanceTerminals,
      peakHours: '9AM-12PM', // This would be calculated from transaction data
      totalTickets: tickets.length,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      scheduledTickets
    };
  }, [terminals, tickets]);

  // Prepare chart data
  const terminalStatusData = [
    { name: 'Online', value: dashboardData.onlineTerminals, color: '#22c55e' },
    { name: 'Offline', value: dashboardData.offlineTerminals, color: '#ef4444' },
    { name: 'Maintenance', value: dashboardData.maintenanceTerminals, color: '#0ea5e9' },
    { name: 'Error', value: dashboardData.errorTerminals, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Support ticket trends (last 6 months)
  const ticketTrendsData = [
    { month: 'Apr', open: Math.floor(Math.random() * 5 + 3), resolved: Math.floor(Math.random() * 8 + 5) },
    { month: 'May', open: Math.floor(Math.random() * 6 + 4), resolved: Math.floor(Math.random() * 9 + 6) },
    { month: 'Jun', open: Math.floor(Math.random() * 4 + 2), resolved: Math.floor(Math.random() * 7 + 4) },
    { month: 'Jul', open: Math.floor(Math.random() * 5 + 3), resolved: Math.floor(Math.random() * 8 + 5) },
    { month: 'Aug', open: Math.floor(Math.random() * 6 + 4), resolved: Math.floor(Math.random() * 9 + 6) },
    { month: 'Sep', open: dashboardData.openTickets, resolved: dashboardData.resolvedTickets }
  ];

  // KPI Card Component
  const KPICard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<any>;
    iconColor?: string;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
  }> = ({ title, value, subtitle, icon: Icon, iconColor = 'text-gray-400', trend, onClick }) => (
    <div 
      className={`card hover:shadow-card-hover transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
        <div className={`p-3 rounded-full bg-gray-50 ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className={`mt-3 flex items-center text-xs ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
        }`}>
          <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
          {trend === 'up' ? 'Improved' : trend === 'down' ? 'Declined' : 'Stable'}
        </div>
      )}
    </div>
  );

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {currentUser?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser?.role === 'Merchant' 
              ? `Monitoring your ${dashboardData.totalTerminals} terminal${dashboardData.totalTerminals !== 1 ? 's' : ''}`
              : `Real-time monitoring of ${dashboardData.totalTerminals} terminals across ${currentUser?.role === 'Administrator' ? 'Zimbabwe' : 'the network'}`
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-sm font-medium text-gray-900">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Terminals"
          value={dashboardData.totalTerminals}
          subtitle={currentUser?.role === 'Merchant' ? 'Your terminals' : 'Across Zimbabwe'}
          icon={Monitor}
          iconColor="text-blue-600"
        />
        <KPICard
          title="Online Status"
          value={`${dashboardData.onlinePercentage}%`}
          subtitle={`${dashboardData.onlineTerminals} of ${dashboardData.totalTerminals} online`}
          icon={CheckCircle}
          iconColor="text-green-600"
          trend={dashboardData.onlinePercentage >= 90 ? 'up' : dashboardData.onlinePercentage >= 70 ? 'neutral' : 'down'}
        />
        <KPICard
          title="Issues Detected"
          value={dashboardData.issuesDetected}
          subtitle={`${dashboardData.offlineTerminals} offline, ${dashboardData.errorTerminals} error`}
          icon={AlertTriangle}
          iconColor={dashboardData.issuesDetected > 0 ? 'text-red-600' : 'text-green-600'}
        />
        <KPICard
          title="Maintenance"
          value={dashboardData.scheduledMaintenance}
          subtitle="Scheduled maintenance"
          icon={Wrench}
          iconColor="text-blue-600"
        />
      </div>

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Avg Uptime"
          value={`${dashboardData.avgUptime}%`}
          subtitle="Last 30 days"
          icon={TrendingUp}
          iconColor="text-green-600"
          trend={dashboardData.avgUptime >= 95 ? 'up' : 'neutral'}
        />
        <KPICard
          title="Avg Resolution"
          value={`${dashboardData.avgResolutionTime}h`}
          subtitle="Support tickets"
          icon={Clock}
          iconColor="text-blue-600"
          trend={dashboardData.avgResolutionTime <= 4 ? 'up' : 'down'}
        />
        <KPICard
          title="Peak Hours"
          value={dashboardData.peakHours}
          subtitle="Highest activity"
          icon={TrendingUp}
          iconColor="text-purple-600"
        />
        <KPICard
          title="SLA Compliance"
          value={`${dashboardData.slaCompliance}%`}
          subtitle="This month"
          icon={CheckCircle}
          iconColor={dashboardData.slaCompliance >= 90 ? 'text-green-600' : 'text-yellow-600'}
          trend={dashboardData.slaCompliance >= 90 ? 'up' : 'neutral'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terminal Status Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Terminal Status Distribution</h3>
            <div className="text-sm text-gray-500">
              <span className="font-medium">{dashboardData.totalTerminals}</span> Total
            </div>
          </div>
          
          {terminalStatusData.length > 0 ? (
            <div className="flex items-center justify-center">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={terminalStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {terminalStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string) => [value, name]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No terminal data available
            </div>
          )}
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {terminalStatusData.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Support Ticket Trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Support Ticket Trends</h3>
            <div className="text-sm text-gray-500">Last 6 months</div>
          </div>
          
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={ticketTrendsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resolved" />
                <Bar dataKey="open" fill="#ef4444" radius={[4, 4, 0, 0]} name="Open" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded bg-red-500 mr-2"></div>
              <span className="text-gray-600">Open</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
              <span className="text-gray-600">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Distribution Card - Show for non-merchants */}
      {currentUser?.role !== 'Merchant' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
            <div className="text-sm text-gray-500">Terminal locations</div>
          </div>
          
          {/* Simple location grid for now - in next steps we'll add a proper map */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terminals.map((terminal) => (
              <div key={terminal.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{terminal.location}</div>
                  <div className="text-xs text-gray-500">{terminal.merchant}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  terminal.status === 'Online' ? 'bg-green-100 text-green-800' :
                  terminal.status === 'Offline' ? 'bg-red-100 text-red-800' :
                  terminal.status === 'Maintenance' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {terminal.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity - Show recent tickets */}
      {dashboardData.totalTickets > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <div className="text-sm text-gray-500">Latest support tickets</div>
          </div>
          
          <div className="space-y-3">
            {tickets.slice(0, 5).map((ticket) => {
              const terminal = terminals.find(t => t.id === ticket.terminalId);
              return (
                <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{ticket.title}</div>
                    <div className="text-xs text-gray-500">
                      {terminal?.location} • {ticket.source} • {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.priority}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      ticket.status === 'Open' ? 'bg-red-100 text-red-800' :
                      ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
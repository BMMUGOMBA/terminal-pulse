// Terminal Pulse - Step 15: Analytics Page with Performance Metrics

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Target
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { localStorageService } from '../services/localStorage';
import { PerformanceMetrics, Terminal, SupportTicket } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Analytics: React.FC = () => {
  const { currentUser, getAccessibleTerminals, getAccessibleTickets } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'terminals' | 'tickets' | 'performance'>('overview');
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        setMetrics(localStorageService.getMetrics());
        setTerminals(getAccessibleTerminals());
        setTickets(getAccessibleTickets());
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getAccessibleTerminals, getAccessibleTickets]);

  // Filter metrics by date range
  const filteredMetrics = useMemo(() => {
    const daysToShow = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return metrics.slice(-daysToShow);
  }, [metrics, dateRange]);

  // Calculate current period vs previous period for comparison
  const periodComparison = useMemo(() => {
    if (filteredMetrics.length === 0) return null;

    const currentPeriod = filteredMetrics.slice(-Math.floor(filteredMetrics.length / 2));
    const previousPeriod = filteredMetrics.slice(0, Math.floor(filteredMetrics.length / 2));

    if (previousPeriod.length === 0 || currentPeriod.length === 0) return null;

    const currentAvg = {
      uptime: currentPeriod.reduce((sum, m) => sum + m.averageUptime, 0) / currentPeriod.length,
      resolution: currentPeriod.reduce((sum, m) => sum + m.averageResolutionTime, 0) / currentPeriod.length,
      slaCompliance: currentPeriod.reduce((sum, m) => sum + m.slaCompliance, 0) / currentPeriod.length,
      satisfaction: currentPeriod.reduce((sum, m) => sum + m.customerSatisfaction, 0) / currentPeriod.length
    };

    const previousAvg = {
      uptime: previousPeriod.reduce((sum, m) => sum + m.averageUptime, 0) / previousPeriod.length,
      resolution: previousPeriod.reduce((sum, m) => sum + m.averageResolutionTime, 0) / previousPeriod.length,
      slaCompliance: previousPeriod.reduce((sum, m) => sum + m.slaCompliance, 0) / previousPeriod.length,
      satisfaction: previousPeriod.reduce((sum, m) => sum + m.customerSatisfaction, 0) / previousPeriod.length
    };

    return {
      uptime: ((currentAvg.uptime - previousAvg.uptime) / previousAvg.uptime) * 100,
      resolution: ((previousAvg.resolution - currentAvg.resolution) / previousAvg.resolution) * 100, // Inverted: lower is better
      slaCompliance: ((currentAvg.slaCompliance - previousAvg.slaCompliance) / previousAvg.slaCompliance) * 100,
      satisfaction: ((currentAvg.satisfaction - previousAvg.satisfaction) / previousAvg.satisfaction) * 100
    };
  }, [filteredMetrics]);

  // Current metrics summary
  const currentMetrics = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return {
        avgUptime: 0,
        avgResolution: 0,
        peakHours: '9AM-12PM',
        slaCompliance: 0
      };
    }

    const latest = filteredMetrics[filteredMetrics.length - 1];
    return {
      avgUptime: latest.averageUptime,
      avgResolution: latest.averageResolutionTime / 60, // Convert to hours
      peakHours: '9AM-12PM', // This would be calculated from actual data
      slaCompliance: latest.slaCompliance
    };
  }, [filteredMetrics]);

  // Prepare chart data
  const uptimeData = filteredMetrics.map(metric => ({
    date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uptime: Math.round(metric.averageUptime * 100) / 100,
    target: 95 // SLA target
  }));

  const ticketTrendsData = filteredMetrics.map(metric => ({
    date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    open: metric.openTickets,
    resolved: metric.resolvedTickets,
    total: metric.totalTickets
  }));

  const terminalStatusData = useMemo(() => {
    const online = terminals.filter(t => t.status === 'Online').length;
    const offline = terminals.filter(t => t.status === 'Offline').length;
    const maintenance = terminals.filter(t => t.status === 'Maintenance').length;
    const error = terminals.filter(t => t.status === 'Error').length;

    return [
      { name: 'Online', value: online, color: '#22c55e' },
      { name: 'Offline', value: offline, color: '#ef4444' },
      { name: 'Maintenance', value: maintenance, color: '#0ea5e9' },
      { name: 'Error', value: error, color: '#f59e0b' }
    ].filter(item => item.value > 0);
  }, [terminals]);

  const resolutionTimeData = filteredMetrics.map(metric => ({
    date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    resolutionTime: Math.round(metric.averageResolutionTime / 60 * 100) / 100, // Convert to hours
    target: 4 // 4 hour target
  }));

  // KPI Card Component
  const KPICard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<any>;
    trend?: number;
    color?: string;
  }> = ({ title, value, subtitle, icon: Icon, trend, color = 'text-blue-600' }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}% vs previous period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-gray-50 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  // Chart wrapper component
  const ChartCard: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }> = ({ title, subtitle, children, actions }) => (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading analytics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Performance insights and reporting</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          {/* Export Button */}
          <button className="btn-outline flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white p-1 rounded-lg shadow-sm border">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'terminals', label: 'Terminals', icon: PieChartIcon },
            { id: 'tickets', label: 'Support Tickets', icon: Target },
            { id: 'performance', label: 'Performance', icon: LineChartIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedView === tab.id
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Avg Uptime"
          value={`${currentMetrics.avgUptime.toFixed(1)}%`}
          subtitle="Last 30 days"
          icon={TrendingUp}
          trend={periodComparison?.uptime}
          color="text-green-600"
        />
        <KPICard
          title="Avg Resolution"
          value={`${currentMetrics.avgResolution.toFixed(1)}h`}
          subtitle="Support tickets"
          icon={Clock}
          trend={periodComparison?.resolution}
          color="text-blue-600"
        />
        <KPICard
          title="Peak Hours"
          value={currentMetrics.peakHours}
          subtitle="Highest activity"
          icon={BarChart3}
          color="text-purple-600"
        />
        <KPICard
          title="SLA Compliance"
          value={`${currentMetrics.slaCompliance.toFixed(0)}%`}
          subtitle="This month"
          icon={CheckCircle}
          trend={periodComparison?.slaCompliance}
          color={currentMetrics.slaCompliance >= 90 ? 'text-green-600' : 'text-orange-600'}
        />
      </div>

      {/* Charts based on selected view */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terminal Status Distribution */}
          <ChartCard title="Terminal Status Distribution" subtitle={`${terminals.length} terminals total`}>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
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
          </ChartCard>

          {/* Support Ticket Trends */}
          <ChartCard title="Support Ticket Trends" subtitle="Daily ticket activity">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={ticketTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resolved" />
                  <Bar dataKey="open" fill="#ef4444" radius={[4, 4, 0, 0]} name="Open" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {selectedView === 'performance' && (
        <div className="space-y-6">
          {/* System Uptime Trend */}
          <ChartCard title="System Uptime Trend" subtitle="Average uptime across all terminals">
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={uptimeData}>
                  <defs>
                    <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis domain={[80, 100]} stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [`${value}%`, name === 'uptime' ? 'Actual Uptime' : 'Target']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uptime" 
                    stroke="#22c55e" 
                    fill="url(#uptimeGradient)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#dc2626" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Resolution Time Trend */}
          <ChartCard title="Average Resolution Time" subtitle="Support ticket resolution performance">
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={resolutionTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [`${value}h`, name === 'resolutionTime' ? 'Avg Resolution' : 'Target']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolutionTime" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                    dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#dc2626" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Terminal Performance Table */}
      {selectedView === 'terminals' && (
        <ChartCard title="Terminal Performance" subtitle="Individual terminal metrics">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Terminal ID</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Uptime</th>
                  <th>Transactions Today</th>
                  <th>Last Transaction</th>
                </tr>
              </thead>
              <tbody>
                {terminals.map(terminal => (
                  <tr key={terminal.id}>
                    <td className="font-medium">{terminal.id}</td>
                    <td>{terminal.location}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        terminal.status === 'Online' ? 'bg-green-100 text-green-800' :
                        terminal.status === 'Offline' ? 'bg-red-100 text-red-800' :
                        terminal.status === 'Maintenance' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {terminal.status}
                      </span>
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
                    <td>{terminal.transactionsToday}</td>
                    <td className="text-sm text-gray-500">
                      {terminal.lastTransaction ? 
                        new Date(terminal.lastTransaction).toLocaleTimeString() : 
                        'No transactions'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {/* Additional insights section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {terminals.filter(t => t.status === 'Online').length}
          </div>
          <div className="text-sm text-gray-500">Terminals Online</div>
          <div className="text-xs text-gray-400 mt-1">
            {Math.round((terminals.filter(t => t.status === 'Online').length / terminals.length) * 100)}% of network
          </div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {tickets.filter(t => t.status === 'Resolved').length}
          </div>
          <div className="text-sm text-gray-500">Tickets Resolved</div>
          <div className="text-xs text-gray-400 mt-1">This month</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {terminals.reduce((sum, t) => sum + t.transactionsToday, 0)}
          </div>
          <div className="text-sm text-gray-500">Transactions Today</div>
          <div className="text-xs text-gray-400 mt-1">Across all terminals</div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
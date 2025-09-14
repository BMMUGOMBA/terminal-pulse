// Terminal Pulse - Step 16: Reports Page for Data Export and Report Generation

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStorageService } from '../services/localStorage';
import { ReportFilter, Terminal, SupportTicket, PerformanceMetrics } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reports: React.FC = () => {
  const { currentUser, getAccessibleTerminals, getAccessibleTickets } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  
  // Report configuration state
  const [reportConfig, setReportConfig] = useState<ReportFilter>({
    category: '',
    type: '',
    timeRange: 'Last 30 Days',
    locationFilter: 'All Locations',
    terminalStatus: 'All Statuses',
    exportFormat: 'PDF Report',
    includeCharts: true,
    includeExecutiveSummary: true,
    includeRawData: false,
    includeRecommendations: true
  });

  // Generated reports history
  const [reportHistory, setReportHistory] = useState<any[]>([
    {
      id: 'RPT-001',
      name: 'Monthly Performance Report - August 2025',
      type: 'Performance Analysis',
      generatedBy: 'Sarah Chigumba',
      generatedAt: new Date('2025-08-31T10:30:00'),
      size: '2.4 MB',
      format: 'PDF'
    },
    {
      id: 'RPT-002', 
      name: 'Terminal Status Report - Q3 2025',
      type: 'Terminal Analytics',
      generatedBy: 'Chipo Nhongo',
      generatedAt: new Date('2025-09-01T14:15:00'),
      size: '1.8 MB',
      format: 'Excel'
    },
    {
      id: 'RPT-003',
      name: 'Support Tickets Summary - September 2025',
      type: 'Support Analysis',
      generatedBy: currentUser?.fullName || 'Current User',
      generatedAt: new Date('2025-09-10T09:45:00'),
      size: '950 KB',
      format: 'PDF'
    }
  ]);

  // Available report categories and types
  const reportCategories = [
    {
      id: 'performance',
      name: 'Performance Reports',
      types: [
        { id: 'uptime', name: 'Uptime Analysis' },
        { id: 'transaction', name: 'Transaction Volume' },
        { id: 'efficiency', name: 'Operational Efficiency' },
        { id: 'comparison', name: 'Period Comparison' }
      ]
    },
    {
      id: 'support',
      name: 'Support Reports', 
      types: [
        { id: 'ticket_summary', name: 'Ticket Summary' },
        { id: 'sla_compliance', name: 'SLA Compliance' },
        { id: 'resolution_times', name: 'Resolution Times' },
        { id: 'agent_performance', name: 'Agent Performance' }
      ]
    },
    {
      id: 'terminals',
      name: 'Terminal Reports',
      types: [
        { id: 'status_overview', name: 'Status Overview' },
        { id: 'maintenance', name: 'Maintenance Schedule' },
        { id: 'geographic', name: 'Geographic Distribution' },
        { id: 'utilization', name: 'Terminal Utilization' }
      ]
    },
    {
      id: 'executive',
      name: 'Executive Reports',
      types: [
        { id: 'dashboard', name: 'Executive Dashboard' },
        { id: 'monthly_summary', name: 'Monthly Summary' },
        { id: 'trend_analysis', name: 'Trend Analysis' },
        { id: 'strategic_insights', name: 'Strategic Insights' }
      ]
    }
  ];

  // Load data on component mount
  useEffect(() => {
    setTerminals(getAccessibleTerminals());
    setTickets(getAccessibleTickets());
    setMetrics(localStorageService.getMetrics());
  }, [getAccessibleTerminals, getAccessibleTickets]);

  // Handle report configuration changes
  const updateReportConfig = (field: keyof ReportFilter, value: any) => {
    setReportConfig(prev => ({ ...prev, [field]: value }));
  };

  // Get available types for selected category
  const getTypesForCategory = () => {
    const category = reportCategories.find(cat => cat.id === reportConfig.category);
    return category?.types || [];
  };

  // Generate mock report data based on configuration
  const generateReportData = () => {
    const data: any = {
      metadata: {
        title: getTypesForCategory().find(t => t.id === reportConfig.type)?.name || 'Report',
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser?.fullName,
        dateRange: reportConfig.timeRange,
        filters: {
          location: reportConfig.locationFilter,
          status: reportConfig.terminalStatus
        }
      },
      summary: {},
      data: {}
    };

    // Add summary data based on report type
    if (reportConfig.category === 'performance') {
      data.summary = {
        totalTerminals: terminals.length,
        averageUptime: terminals.reduce((sum, t) => sum + t.uptime, 0) / terminals.length,
        totalTransactions: terminals.reduce((sum, t) => sum + t.transactionsToday, 0),
        onlinePercentage: (terminals.filter(t => t.status === 'Online').length / terminals.length) * 100
      };
    } else if (reportConfig.category === 'support') {
      data.summary = {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'Open').length,
        resolvedTickets: tickets.filter(t => t.status === 'Resolved').length,
        averageResolutionTime: '3.5 hours',
        slaCompliance: '94%'
      };
    }

    // Add detailed data if requested
    if (reportConfig.includeRawData) {
      data.terminals = terminals;
      data.tickets = tickets;
    }

    return data;
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    if (!reportConfig.category || !reportConfig.type) {
      alert('Please select a report category and type');
      return;
    }

    setGenerateLoading(true);

    try {
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      const reportData = generateReportData();
      const typeName = getTypesForCategory().find(t => t.id === reportConfig.type)?.name || 'Report';
      
      // Create new report entry
      const newReport = {
        id: `RPT-${Date.now().toString().slice(-3)}`,
        name: `${typeName} - ${new Date().toLocaleDateString()}`,
        type: typeName,
        generatedBy: currentUser?.fullName || 'Unknown',
        generatedAt: new Date(),
        size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
        format: reportConfig.exportFormat.split(' ')[0]
      };

      setReportHistory(prev => [newReport, ...prev]);

      // Simulate file download
      if (reportConfig.exportFormat === 'PDF Report') {
        downloadPDFReport(reportData, newReport.name);
      } else if (reportConfig.exportFormat === 'CSV Export') {
        downloadCSVReport(reportData, newReport.name);
      } else if (reportConfig.exportFormat === 'Excel Export') {
        downloadExcelReport(reportData, newReport.name);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setGenerateLoading(false);
    }
  };

  // Download functions
  const downloadPDFReport = (data: any, filename: string) => {
    const content = `
Terminal Pulse Report: ${data.metadata.title}
Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}
Generated by: ${data.metadata.generatedBy}

EXECUTIVE SUMMARY
${reportConfig.includeExecutiveSummary ? `
- Total Terminals: ${data.summary.totalTerminals || 'N/A'}
- Average Uptime: ${data.summary.averageUptime?.toFixed(1) || 'N/A'}%
- SLA Compliance: ${data.summary.slaCompliance || 'N/A'}
- Report Period: ${data.metadata.dateRange}
` : 'Executive summary not included'}

Generated with Terminal Pulse Analytics Platform
© 2025 Stanbic Bank Zimbabwe
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadCSVReport = (data: any, filename: string) => {
    let csvContent = 'Terminal ID,Location,Merchant,Status,Uptime,Transactions Today\n';
    
    if (reportConfig.includeRawData && data.terminals) {
      csvContent += data.terminals.map((terminal: Terminal) => 
        `${terminal.id},${terminal.location},${terminal.merchant},${terminal.status},${terminal.uptime},${terminal.transactionsToday}`
      ).join('\n');
    } else {
      csvContent += 'No raw data included in report configuration';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadExcelReport = (data: any, filename: string) => {
    // For demo purposes, download as CSV with Excel extension
    downloadCSVReport(data, filename.replace('.csv', '.xlsx'));
  };

  // Preview report
  const handlePreviewReport = () => {
    if (!reportConfig.category || !reportConfig.type) {
      alert('Please select a report category and type to preview');
      return;
    }

    const reportData = generateReportData();
    alert(`Report Preview:\n\nTitle: ${reportData.metadata.title}\nTerminals: ${reportData.summary.totalTerminals || 'N/A'}\nGenerated: ${new Date().toLocaleString()}\n\nThis is a preview. Click "Generate Report" to create the full report.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and export system reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration Panel */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Generate Report</h2>
            
            <div className="space-y-6">
              {/* Report Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Category
                </label>
                <select
                  className="select w-full"
                  value={reportConfig.category}
                  onChange={(e) => {
                    updateReportConfig('category', e.target.value);
                    updateReportConfig('type', ''); // Reset type when category changes
                  }}
                >
                  <option value="">Select Category</option>
                  {reportCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  className="select w-full"
                  value={reportConfig.type}
                  onChange={(e) => updateReportConfig('type', e.target.value)}
                  disabled={!reportConfig.category}
                >
                  <option value="">Select Report Type</option>
                  {getTypesForCategory().map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range and Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Range
                  </label>
                  <select
                    className="select w-full"
                    value={reportConfig.timeRange}
                    onChange={(e) => updateReportConfig('timeRange', e.target.value as any)}
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Filter
                  </label>
                  <select
                    className="select w-full"
                    value={reportConfig.locationFilter}
                    onChange={(e) => updateReportConfig('locationFilter', e.target.value)}
                  >
                    <option value="All Locations">All Locations</option>
                    <option value="Harare">Harare</option>
                    <option value="Bulawayo">Bulawayo</option>
                    <option value="Mutare">Mutare</option>
                    <option value="Gweru">Gweru</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terminal Status
                  </label>
                  <select
                    className="select w-full"
                    value={reportConfig.terminalStatus}
                    onChange={(e) => updateReportConfig('terminalStatus', e.target.value as any)}
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Error">Error</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range */}
              {reportConfig.timeRange === 'Custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="input w-full"
                      placeholder="dd/mm/yyyy"
                      onChange={(e) => updateReportConfig('startDate', new Date(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="input w-full"
                      placeholder="dd/mm/yyyy"
                      onChange={(e) => updateReportConfig('endDate', new Date(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  className="select w-full"
                  value={reportConfig.exportFormat}
                  onChange={(e) => updateReportConfig('exportFormat', e.target.value as any)}
                >
                  <option value="PDF Report">PDF Report</option>
                  <option value="CSV Export">CSV Export</option>
                  <option value="Excel Export">Excel Export</option>
                  <option value="Power BI">Power BI Dataset</option>
                </select>
              </div>

              {/* Report Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Report Options
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeCharts"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={reportConfig.includeCharts}
                      onChange={(e) => updateReportConfig('includeCharts', e.target.checked)}
                    />
                    <label htmlFor="includeCharts" className="ml-2 text-sm text-gray-700">
                      Include Charts and Graphs
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeExecutiveSummary"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={reportConfig.includeExecutiveSummary}
                      onChange={(e) => updateReportConfig('includeExecutiveSummary', e.target.checked)}
                    />
                    <label htmlFor="includeExecutiveSummary" className="ml-2 text-sm text-gray-700">
                      Include Executive Summary
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeRawData"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={reportConfig.includeRawData}
                      onChange={(e) => updateReportConfig('includeRawData', e.target.checked)}
                    />
                    <label htmlFor="includeRawData" className="ml-2 text-sm text-gray-700">
                      Include Raw Data Tables
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeRecommendations"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={reportConfig.includeRecommendations}
                      onChange={(e) => updateReportConfig('includeRecommendations', e.target.checked)}
                    />
                    <label htmlFor="includeRecommendations" className="ml-2 text-sm text-gray-700">
                      Include Recommendations
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={handlePreviewReport}
                  className="btn-outline flex items-center"
                  disabled={generateLoading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Report
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="btn-primary flex items-center"
                  disabled={generateLoading}
                >
                  {generateLoading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Generate Report
                </button>
              </div>

              {generateLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <LoadingSpinner size="small" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-blue-800">
                        Generating Report...
                      </div>
                      <div className="text-xs text-blue-600">
                        Large reports may take several minutes to generate
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Note about report generation */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div className="text-sm text-yellow-800">
                    <strong>Note:</strong> Large reports may take several minutes to generate. 
                    You will be notified when the report is ready for download.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report History Sidebar */}
        <div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            
            <div className="space-y-3">
              {reportHistory.map((report) => (
                <div key={report.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {report.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {report.type}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-2 flex flex-col items-end text-xs text-gray-500">
                      <span className="bg-white px-2 py-1 rounded border">
                        {report.format}
                      </span>
                      <span className="mt-1">{report.size}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      by {report.generatedBy}
                    </span>
                    <button className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
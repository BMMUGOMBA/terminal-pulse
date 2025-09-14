// Terminal Pulse - Step 3: TypeScript Data Models

export type UserRole = 'Administrator' | 'Support Agent' | 'Service Desk Manager' | 'Merchant';

export type TerminalStatus = 'Online' | 'Offline' | 'Maintenance' | 'Error';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Scheduled';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketSource = 'System' | 'Merchant' | 'Customer Call' | 'WhatsApp' | 'Email';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string; // In real app, this would be hashed
  role: UserRole;
  status: 'Active' | 'Locked';
  failedLoginAttempts: number;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Role-specific fields
  assignedTerminals?: string[]; // For merchants
  permissions?: string[]; // For granular access control
}

export interface Terminal {
  id: string;
  location: string;
  merchant: string;
  status: TerminalStatus;
  lastSeen: Date;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Technical details
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  networkType?: 'WiFi' | 'Ethernet' | '4G' | '3G';
  // Performance metrics
  uptime: number; // percentage
  transactionsToday: number;
  lastTransaction: Date | null;
  // Maintenance
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  terminalId: string;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  // User relationships
  reportedBy: string; // User ID
  assignedTo: string | null; // User ID
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  // SLA tracking
  slaTarget: Date;
  slaBreach: boolean;
  slaBreachDuration: number; // minutes over SLA
  // Resolution details
  resolution?: string;
  resolutionTime?: number; // minutes to resolve
  // Customer satisfaction
  satisfactionRating?: number; // 1-5
  feedback?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  isInternal: boolean; // internal notes vs customer-facing
  createdAt: Date;
}

export interface SystemAlert {
  id: string;
  type: 'Terminal Down' | 'SLA Breach' | 'High Priority Ticket' | 'System Error';
  message: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  terminalId?: string;
  ticketId?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  createdAt: Date;
  acknowledgedAt?: Date;
}

export interface PerformanceMetrics {
  date: string;
  totalTerminals: number;
  onlineTerminals: number;
  offlineTerminals: number;
  maintenanceTerminals: number;
  errorTerminals: number;
  averageUptime: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number; // in minutes
  slaCompliance: number; // percentage
  customerSatisfaction: number; // average rating
}

export interface DashboardKPIs {
  totalTerminals: number;
  onlineStatus: number; // percentage
  issuesDetected: number;
  scheduledMaintenance: number;
  avgUptime: number;
  avgResolutionTime: number; // in hours
  peakHours: string;
  slaCompliance: number;
}

export interface ReportFilter {
  category: string;
  type: string;
  timeRange: 'Last 7 Days' | 'Last 30 Days' | 'Last 90 Days' | 'Custom';
  startDate?: Date;
  endDate?: Date;
  locationFilter: string;
  terminalStatus: TerminalStatus | 'All Statuses';
  exportFormat: 'PDF Report' | 'CSV Export' | 'Excel Export' | 'Power BI';
  includeCharts: boolean;
  includeExecutiveSummary: boolean;
  includeRawData: boolean;
  includeRecommendations: boolean;
}

// Context interfaces for state management
export interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export interface AppState {
  terminals: Terminal[];
  tickets: SupportTicket[];
  users: User[];
  alerts: SystemAlert[];
  performanceMetrics: PerformanceMetrics[];
  currentUser: User | null;
}
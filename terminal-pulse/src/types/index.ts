// Terminal Pulse - Updated Types with Enhanced AuthContextType

export type UserRole = 'Administrator' | 'Support Agent' | 'Service Desk Manager' | 'Merchant';
export type TerminalStatus = 'Online' | 'Offline' | 'Maintenance' | 'Error';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Scheduled';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketSource = 'System' | 'Merchant' | 'Customer Call' | 'WhatsApp' | 'Email';

// ... (all previous interfaces remain the same) ...

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: 'Active' | 'Locked';
  failedLoginAttempts: number;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTerminals?: string[];
  permissions?: string[];
}

export interface Terminal {
  id: string;
  location: string;
  merchant: string;
  status: TerminalStatus;
  lastSeen: Date;
  coordinates: { lat: number; lng: number };
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  networkType?: 'WiFi' | 'Ethernet' | '4G' | '3G';
  uptime: number;
  transactionsToday: number;
  lastTransaction: Date | null;
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
  reportedBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  slaTarget: Date;
  slaBreach: boolean;
  slaBreachDuration: number;
  resolution?: string;
  resolutionTime?: number;
  satisfactionRating?: number;
  feedback?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
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
  averageResolutionTime: number;
  slaCompliance: number;
  customerSatisfaction: number;
}

export interface DashboardKPIs {
  totalTerminals: number;
  onlineStatus: number;
  issuesDetected: number;
  scheduledMaintenance: number;
  avgUptime: number;
  avgResolutionTime: number;
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

// Enhanced AuthContextType to match the context implementation
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  updateCurrentUser: (updates: Partial<User>) => void;
  clearError: () => void;
  // Helper methods
  isAdmin: () => boolean;
  isManager: () => boolean;
  isSupport: () => boolean;
  isMerchant: () => boolean;
  getAccessibleTerminals: () => Terminal[];
  getAccessibleTickets: () => SupportTicket[];
}

export interface AppState {
  terminals: Terminal[];
  tickets: SupportTicket[];
  users: User[];
  alerts: SystemAlert[];
  performanceMetrics: PerformanceMetrics[];
  currentUser: User | null;
}
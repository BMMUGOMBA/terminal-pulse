// Terminal Pulse - Fixed LocalStorage Service

import { 
  User, 
  Terminal, 
  SupportTicket, 
  TicketComment, 
  SystemAlert, 
  PerformanceMetrics,
  TerminalStatus,
  TicketStatus,
  UserRole 
} from '../types';

class LocalStorageService {
  private static instance: LocalStorageService;
  private readonly STORAGE_KEYS = {
    USERS: 'terminal_pulse_users',
    TERMINALS: 'terminal_pulse_terminals',
    TICKETS: 'terminal_pulse_tickets',
    COMMENTS: 'terminal_pulse_comments',
    ALERTS: 'terminal_pulse_alerts',
    METRICS: 'terminal_pulse_metrics',
    CURRENT_USER: 'terminal_pulse_current_user'
  };

  private constructor() {
    this.initializeData();
  }

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  // Generic storage methods
  private setItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }

  private getItem<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return null;
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
    }
  }

  // Initialize with sample data
  private initializeData(): void {
    if (!this.getItem(this.STORAGE_KEYS.USERS)) {
      this.setItem(this.STORAGE_KEYS.USERS, this.generateSampleUsers());
    }
    if (!this.getItem(this.STORAGE_KEYS.TERMINALS)) {
      this.setItem(this.STORAGE_KEYS.TERMINALS, this.generateSampleTerminals());
    }
    if (!this.getItem(this.STORAGE_KEYS.TICKETS)) {
      this.setItem(this.STORAGE_KEYS.TICKETS, this.generateSampleTickets());
    }
    if (!this.getItem(this.STORAGE_KEYS.ALERTS)) {
      this.setItem(this.STORAGE_KEYS.ALERTS, this.generateSampleAlerts());
    }
    if (!this.getItem(this.STORAGE_KEYS.METRICS)) {
      this.setItem(this.STORAGE_KEYS.METRICS, this.generateSampleMetrics());
    }
  }

  // User Management
  getUsers(): User[] {
    return this.getItem<User[]>(this.STORAGE_KEYS.USERS) || [];
  }

  getUserById(id: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.username === username);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(newUser);
    this.setItem(this.STORAGE_KEYS.USERS, users);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates, updatedAt: new Date() };
    this.setItem(this.STORAGE_KEYS.USERS, users);
    return users[index];
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    if (filteredUsers.length === users.length) return false;
    
    this.setItem(this.STORAGE_KEYS.USERS, filteredUsers);
    return true;
  }

  // Authentication
  getCurrentUser(): User | null {
    return this.getItem<User>(this.STORAGE_KEYS.CURRENT_USER);
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      this.setItem(this.STORAGE_KEYS.CURRENT_USER, user);
    } else {
      this.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    }
  }

  // Terminal Management
  getTerminals(): Terminal[] {
    return this.getItem<Terminal[]>(this.STORAGE_KEYS.TERMINALS) || [];
  }

  getTerminalById(id: string): Terminal | undefined {
    const terminals = this.getTerminals();
    return terminals.find(terminal => terminal.id === id);
  }

  getTerminalsByUser(userId: string): Terminal[] {
    const user = this.getUserById(userId);
    if (!user || user.role !== 'Merchant') return this.getTerminals();
    
    return this.getTerminals().filter(terminal => 
      user.assignedTerminals?.includes(terminal.id)
    );
  }

  updateTerminal(id: string, updates: Partial<Terminal>): Terminal | null {
    const terminals = this.getTerminals();
    const index = terminals.findIndex(terminal => terminal.id === id);
    if (index === -1) return null;
    
    terminals[index] = { ...terminals[index], ...updates, updatedAt: new Date() };
    this.setItem(this.STORAGE_KEYS.TERMINALS, terminals);
    return terminals[index];
  }

  updateTerminalStatus(id: string, status: TerminalStatus): boolean {
    const terminal = this.updateTerminal(id, { 
      status, 
      lastSeen: new Date() 
    });
    return terminal !== null;
  }

  // Support Tickets
  getTickets(): SupportTicket[] {
    return this.getItem<SupportTicket[]>(this.STORAGE_KEYS.TICKETS) || [];
  }

  getTicketsByUser(userId: string): SupportTicket[] {
    const user = this.getUserById(userId);
    if (!user) return [];

    if (user.role === 'Merchant') {
      const userTerminals = user.assignedTerminals || [];
      return this.getTickets().filter(ticket => 
        userTerminals.includes(ticket.terminalId)
      );
    }
    
    return this.getTickets();
  }

  createTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): SupportTicket {
    const tickets = this.getTickets();
    const newTicket: SupportTicket = {
      id: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      ...ticketData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    tickets.push(newTicket);
    this.setItem(this.STORAGE_KEYS.TICKETS, tickets);
    return newTicket;
  }

  updateTicket(id: string, updates: Partial<SupportTicket>): SupportTicket | null {
    const tickets = this.getTickets();
    const index = tickets.findIndex(ticket => ticket.id === id);
    if (index === -1) return null;
    
    tickets[index] = { ...tickets[index], ...updates, updatedAt: new Date() };
    this.setItem(this.STORAGE_KEYS.TICKETS, tickets);
    return tickets[index];
  }

  // System Alerts
  getAlerts(): SystemAlert[] {
    return this.getItem<SystemAlert[]>(this.STORAGE_KEYS.ALERTS) || [];
  }

  createAlert(alertData: Omit<SystemAlert, 'id' | 'createdAt'>): SystemAlert {
    const alerts = this.getAlerts();
    const newAlert: SystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      createdAt: new Date()
    };
    alerts.push(newAlert);
    this.setItem(this.STORAGE_KEYS.ALERTS, alerts);
    return newAlert;
  }

  // Performance Metrics
  getMetrics(): PerformanceMetrics[] {
    return this.getItem<PerformanceMetrics[]>(this.STORAGE_KEYS.METRICS) || [];
  }

  // Clear all data
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
    this.initializeData();
  }

  // Sample Data Generation
  private generateSampleUsers(): User[] {
    return [
      {
        id: 'user-admin-001',
        fullName: 'Tendai Mukamuri',
        username: 'admin.mukamuri',
        email: 'admin.mukamuri@stanbic.co.zw',
        password: 'admin123',
        role: 'Administrator' as UserRole,
        status: 'Active',
        failedLoginAttempts: 0,
        lastLogin: new Date('2025-09-03T19:05:13'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-09-03T19:05:13')
      },
      {
        id: 'user-support-001',
        fullName: 'Chipo Nhongo',
        username: 'support.nhongo',
        email: 'support.nhongo@stanbic.co.zw',
        password: 'support123',
        role: 'Support Agent' as UserRole,
        status: 'Active',
        failedLoginAttempts: 0,
        lastLogin: new Date('2025-08-25T13:51:55'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-08-25T13:51:55')
      },
      {
        id: 'user-manager-001',
        fullName: 'Sarah Chigumba',
        username: 'servicedesk.manager',
        email: 'servicedesk.manager@stanbic.co.zw',
        password: 'manager123',
        role: 'Service Desk Manager' as UserRole,
        status: 'Active',
        failedLoginAttempts: 0,
        lastLogin: new Date('2025-09-03T19:14:46'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-09-03T19:14:46')
      },
      {
        id: 'user-merchant-001',
        fullName: 'Tafadzwa Mutasa',
        username: 'merchant.mutasa',
        email: 'merchant.mutasa@stanbic.co.zw',
        password: 'merchant123',
        role: 'Merchant' as UserRole,
        status: 'Active',
        failedLoginAttempts: 0,
        lastLogin: new Date('2025-08-23T22:17:10'),
        assignedTerminals: ['T001'],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-08-23T22:17:10')
      }
    ];
  }

  private generateSampleTerminals(): Terminal[] {
    return [
      {
        id: 'T001',
        location: 'Harare CBD',
        merchant: 'Pick n Pay',
        status: 'Online' as TerminalStatus,
        lastSeen: new Date(),
        coordinates: { lat: -17.8292, lng: 31.0522 },
        uptime: 100,
        transactionsToday: 45,
        lastTransaction: new Date(),
        lastMaintenance: null,
        nextMaintenance: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date()
      },
      {
        id: 'T002',
        location: 'Bulawayo City',
        merchant: 'Ushe Manhuna',
        status: 'Online' as TerminalStatus,
        lastSeen: new Date(Date.now() - 9 * 60000),
        coordinates: { lat: -20.1594, lng: 28.5906 },
        uptime: 98.5,
        transactionsToday: 32,
        lastTransaction: new Date(Date.now() - 30 * 60000),
        lastMaintenance: null,
        nextMaintenance: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date()
      },
      {
        id: 'T003',
        location: 'Mutare Center',
        merchant: 'Ushe Manhuna',
        status: 'Offline' as TerminalStatus,
        lastSeen: new Date(Date.now() - 2 * 60 * 60000),
        coordinates: { lat: -18.9707, lng: 32.6473 },
        uptime: 85.2,
        transactionsToday: 0,
        lastTransaction: new Date(Date.now() - 3 * 60 * 60000),
        lastMaintenance: null,
        nextMaintenance: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date()
      },
      {
        id: 'T004',
        location: 'Gweru Main',
        merchant: 'Choppies',
        status: 'Maintenance' as TerminalStatus,
        lastSeen: new Date(Date.now() - 34 * 60000),
        coordinates: { lat: -19.4543, lng: 29.8154 },
        uptime: 92.1,
        transactionsToday: 15,
        lastTransaction: new Date(Date.now() - 60 * 60000),
        lastMaintenance: null,
        nextMaintenance: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date()
      },
      {
        id: 'T005',
        location: 'Masvingo Plaza',
        merchant: 'Food World',
        status: 'Online' as TerminalStatus,
        lastSeen: new Date(Date.now() - 5 * 60000),
        coordinates: { lat: -20.0716, lng: 30.8272 },
        uptime: 96.8,
        transactionsToday: 28,
        lastTransaction: new Date(Date.now() - 15 * 60000),
        lastMaintenance: null,
        nextMaintenance: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date()
      }
    ];
  }

  private generateSampleTickets(): SupportTicket[] {
    return [
      {
        id: 'TKT-2025-001',
        title: 'Terminal Offline - Pick n Pay Borrowdale',
        description: 'Terminal T001 has been offline for over 2 hours',
        terminalId: 'T001',
        priority: 'High',
        status: 'Open' as TicketStatus,
        source: 'System',
        reportedBy: 'user-admin-001',
        assignedTo: 'user-support-001',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60000),
        resolvedAt: null,
        slaTarget: new Date(Date.now() - 10 * 24 * 60 * 60000 + 4 * 60 * 60000),
        slaBreach: true,
        slaBreachDuration: 259 * 60
      }
    ];
  }

  private generateSampleAlerts(): SystemAlert[] {
    return [
      {
        id: 'alert-001',
        type: 'Terminal Down',
        message: 'Terminal T003 (Mutare Center) has been offline for 2 hours',
        severity: 'High',
        terminalId: 'T003',
        acknowledged: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60000)
      }
    ];
  }

  private generateSampleMetrics(): PerformanceMetrics[] {
    const metrics: PerformanceMetrics[] = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      metrics.push({
        date: date.toISOString().split('T')[0],
        totalTerminals: 20,
        onlineTerminals: Math.floor(Math.random() * 8 + 12),
        offlineTerminals: Math.floor(Math.random() * 4 + 0),
        maintenanceTerminals: Math.floor(Math.random() * 3 + 0),
        errorTerminals: Math.floor(Math.random() * 3 + 0),
        averageUptime: Math.random() * 20 + 80,
        totalTickets: Math.floor(Math.random() * 15 + 5),
        openTickets: Math.floor(Math.random() * 8 + 2),
        resolvedTickets: Math.floor(Math.random() * 10 + 3),
        averageResolutionTime: Math.random() * 240 + 60,
        slaCompliance: Math.random() * 15 + 85,
        customerSatisfaction: Math.random() * 1 + 4
      });
    }
    
    return metrics;
  }
}

export const localStorageService = LocalStorageService.getInstance();
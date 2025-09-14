// Terminal Pulse - Missing Utility Files

// =================================================================
// src/utils/formatters.ts - Utility Formatters
// =================================================================

export const formatters = {
  // Format time ago
  timeAgo: (date: Date | string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return then.toLocaleDateString();
  },

  // Format file size
  fileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format percentage
  percentage: (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
  },

  // Format duration
  duration: (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  },

  // Format currency
  currency: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Truncate text
  truncate: (text: string, length: number): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
};

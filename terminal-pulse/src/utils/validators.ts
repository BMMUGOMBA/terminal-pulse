// =================================================================
// src/utils/validators.ts - Form Validation Utilities
// =================================================================

export const validators = {
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  username: (username: string): boolean => {
    return /^[a-zA-Z0-9._-]{3,20}$/.test(username);
  },

  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  }
};
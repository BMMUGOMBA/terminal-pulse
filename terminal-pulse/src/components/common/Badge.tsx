// =================================================================
// src/components/common/Badge.tsx
// =================================================================

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'online' | 'offline' | 'maintenance' | 'error' | 'low' | 'medium' | 'high' | 'critical' | 'default';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'medium',
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm'
  };

  const variantClasses = {
    online: 'bg-green-100 text-green-800 border border-green-200',
    offline: 'bg-red-100 text-red-800 border border-red-200',
    maintenance: 'bg-blue-100 text-blue-800 border border-blue-200',
    error: 'bg-orange-100 text-orange-800 border border-orange-200',
    low: 'bg-gray-100 text-gray-800 border border-gray-200',
    medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    high: 'bg-red-100 text-red-800 border border-red-200',
    critical: 'bg-red-200 text-red-900 border border-red-300',
    default: 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
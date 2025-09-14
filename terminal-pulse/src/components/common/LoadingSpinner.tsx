// Terminal Pulse - Missing Common Components

// =================================================================
// src/components/common/LoadingSpinner.tsx
// =================================================================

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text,
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600 mx-auto mb-4`} />
          {text && (
            <p className={`${textSizeClasses[size]} text-gray-600`}>{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600 mx-auto`} />
        {text && (
          <p className={`${textSizeClasses[size]} text-gray-600 mt-2`}>{text}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
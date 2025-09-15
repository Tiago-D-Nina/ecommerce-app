import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down';
    period?: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const titleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const valueSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`bg-white rounded-lg shadow ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`font-medium text-gray-600 ${titleSizes[size]}`}>{title}</p>
          <p className={`font-bold text-gray-900 ${valueSizes[size]} mt-1`}>
            {typeof value === 'number' && value >= 1000
              ? value.toLocaleString('pt-BR')
              : value}
          </p>
        </div>
        {Icon && (
          <div className={`bg-blue-50 rounded-lg flex items-center justify-center ${iconSizes[size]}`}>
            <Icon className={`text-blue-600 ${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'}`} />
          </div>
        )}
      </div>
      
      {change && (
        <div className="mt-4 flex items-center">
          {change.trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`ml-2 text-sm font-medium ${
              change.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change.value}
          </span>
          {change.period && (
            <span className="ml-1 text-sm text-gray-500">
              {change.period}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
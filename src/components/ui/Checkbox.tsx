import React from 'react';
import { ModuleType } from '../../enums';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  module?: ModuleType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card';
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  module,
  size = 'md',
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const moduleClass = module ? `module-${module}` : '';
  
  const baseClasses = `
    rounded border-2 transition-all duration-200 focus:ring-2 focus:ring-offset-2
    ${sizeClasses[size]}
    ${props.checked 
      ? 'bg-current border-current text-white' 
      : 'bg-transparent border-gray-300 dark:border-gray-600'
    }
    ${module ? 'focus:ring-current' : 'focus:ring-blue-500'}
  `;

  const containerClasses = variant === 'card' 
    ? `surface-card p-4 cursor-pointer hover:shadow-md transition-all ${moduleClass}`
    : `flex items-start gap-3 ${moduleClass}`;

  return (
    <div className={containerClasses} style={{ color: module ? 'var(--module-primary)' : undefined }}>
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={checkboxId}
          className="sr-only"
          {...props}
        />
        <div
          className={`${baseClasses} ${className}`}
          onClick={() => {
            const input = document.getElementById(checkboxId) as HTMLInputElement;
            input?.click();
          }}
        >
          {props.checked && (
            <svg className="w-full h-full p-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label 
              htmlFor={checkboxId} 
              className="block font-medium cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm opacity-70 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkbox;
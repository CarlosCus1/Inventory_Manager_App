import React from 'react';
import { ModuleType } from '../../enums';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helpText?: string;
  module?: ModuleType;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'filled';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  module,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'input focus-visible';
  const moduleClass = module ? `input-module module-${module}` : '';
  const sizeClass = size !== 'md' ? `input-${size}` : '';
  const variantClass = variant !== 'default' ? `input-${variant}` : '';
  const errorClass = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  const iconPaddingLeft = leftIcon ? 'pl-12' : '';
  const iconPaddingRight = rightIcon ? 'pr-12' : '';

  const classes = [
    baseClasses,
    moduleClass,
    sizeClass,
    variantClass,
    errorClass,
    iconPaddingLeft,
    iconPaddingRight,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`form-group ${module ? `module-${module}` : ''}`}>
      {label && (
        <label htmlFor={inputId} className="form-label mb-2 block">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <span className="text-gray-400 text-base opacity-70">{leftIcon}</span>
          </div>
        )}
        
        <input
          id={inputId}
          className={classes}
          data-module={module}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center z-10">
            <span className="text-gray-400 text-base opacity-70">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="form-error mt-2 text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="form-help mt-2 text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default Input;
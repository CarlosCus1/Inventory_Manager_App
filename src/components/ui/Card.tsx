import React from 'react';
import { ModuleType } from '../../enums';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  module?: ModuleType;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  module,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...rest
}) => {
  const baseClasses = 'card fade-in';
  
  const variantClasses = {
    default: 'surface-card',
    elevated: 'surface-elevated',
    outlined: 'surface border-2',
    glass: 'glass'
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const moduleClass = module ? `module-${module}` : '';
  const hoverClass = hover ? 'card-hover' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    moduleClass,
    hoverClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} data-module={module} {...rest}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-xl font-bold mb-2" style={{ color: module ? `var(--module-primary)` : undefined }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
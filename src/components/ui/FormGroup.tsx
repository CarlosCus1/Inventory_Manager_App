import React from 'react';
import { ModuleType } from '../../enums';

interface FormGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  module?: ModuleType;
  columns?: 1 | 2 | 3 | 4;
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  title,
  description,
  module,
  columns = 1,
  spacing = 'md',
  className = ''
}) => {
  const moduleClass = module ? `module-${module}` : '';
  const spacingClass = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }[spacing];

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns];

  const classes = [
    'form-section surface-card',
    moduleClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {(title || description) && (
        <div className="mb-6 pb-4 border-b border-gray-200/30 dark:border-gray-700/30">
          {title && (
            <h3 
              className="text-xl font-bold mb-2"
              style={{ color: module ? `var(--module-primary)` : undefined }}
            >
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm opacity-80">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={`grid ${gridClass} ${spacingClass}`}>
        {children}
      </div>
    </div>
  );
};

export default FormGroup;
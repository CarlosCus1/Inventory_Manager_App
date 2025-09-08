// --------------------------------------------------------------------------- #
//                                                                             #
//                      src/components/PageHeader.tsx                          #
//                                                                             #
// --------------------------------------------------------------------------- #

import React from 'react';


interface PageHeaderProps {
  title: string;
  description: string;
  themeColor: 'devoluciones' | 'pedido' | 'inventario' | 'comparador';
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  themeColor, 
  actions 
}) => {
  const moduleClass = `module-${themeColor}`;

  return (
    <header className={`page-header ${moduleClass} slide-up`}>
      <div className="surface-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex-1">
            <h1 className="page-title">
              {title}
            </h1>
            <p className="page-description">
              {description}
            </p>
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
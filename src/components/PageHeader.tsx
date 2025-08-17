// --------------------------------------------------------------------------- #
//                                                                             #
//                      src/components/PageHeader.tsx                          #
//                                                                             #
// --------------------------------------------------------------------------- #

import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  themeColor: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'planificador';
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, themeColor }) => {
  // Mapear a utilidades consistentes con el sistema de tema (Tailwind v4)
  const titleColorByTheme: Record<PageHeaderProps['themeColor'], string> = {
    devoluciones: 'title-devoluciones',
    pedido: 'title-pedido',
    inventario: 'title-inventario',
    comparador: 'title-comparador',

    planificador: 'title-planificador',

  };

  return (
    <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 section-card">
      <div className="flex-1">
        <h1 className={`text-4xl font-extrabold ${titleColorByTheme[themeColor]}`}>
          {title}
        </h1>
        <p className="mt-2">
          {description}
        </p>
      </div>
    </header>
  );
};

export default PageHeader;

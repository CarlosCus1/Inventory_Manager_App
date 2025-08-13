// --------------------------------------------------------------------------- #
//                                                                             #
//                      src/components/PageHeader.tsx                          #
//                                                                             #
// --------------------------------------------------------------------------- #

import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

interface PageHeaderProps {
  title: string;
  description: string;
  themeColor: 'devoluciones' | 'pedido' | 'inventario' | 'comparador';
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, themeColor }) => {
  // Mapear a utilidades consistentes con el sistema de tema (Tailwind v4)
  const titleColorByTheme: Record<PageHeaderProps['themeColor'], string> = {
    devoluciones: 'title-devoluciones',
    pedido: 'title-pedido',
    inventario: 'title-inventario',
    comparador: 'title-comparador',
  };

  const btnClassByTheme: Record<PageHeaderProps['themeColor'], string> = {
    devoluciones: 'btn-module-devoluciones',
    pedido: 'btn-module-pedido',
    inventario: 'btn-module-inventario',
    comparador: 'btn-module-comparador',
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

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          to="/"
          className={`${btnClassByTheme[themeColor]} flex items-center gap-2`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver al Inicio
        </Link>
      </div>
    </header>
  );
};

export default PageHeader;

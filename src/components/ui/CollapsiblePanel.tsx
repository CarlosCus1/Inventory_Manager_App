import React, { useState } from 'react';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  // Optional: Add a prop for the module's theme color if needed for the header
  // themeColor?: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'planificador';
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  defaultCollapsed = true,
  // themeColor,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Determine header classes based on themeColor if implemented
  // const headerClasses = themeColor ? `title-${themeColor}` : 'form-section-title';

  return (
    <div className="section-card"> {/* Reusing section-card for consistent styling */}
      <button
        className="w-full flex justify-between items-center py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={toggleCollapse}
        aria-expanded={!isCollapsed}
        aria-controls={`panel-content-${title.replace(/\s/g, '-')}`}
      >
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          {title}
        </h2>
        <svg
          className={`w-5 h-5 transform transition-transform duration-200 ${
            isCollapsed ? 'rotate-0' : 'rotate-180'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        id={`panel-content-${title.replace(/\s/g, '-')}`}
        role="region"
        aria-hidden={isCollapsed}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100 pt-4'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

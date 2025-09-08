import React from 'react';
import { ModuleType } from '../../enums';

interface ModuleDebuggerProps {
  module: ModuleType;
  title: string;
}

export const ModuleDebugger: React.FC<ModuleDebuggerProps> = ({ module, title }) => {
  return (
    <div className={`module-${module} p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4`}>
      <h4 className="font-bold mb-2" style={{ color: 'var(--module-primary)' }}>
        {title} - Debug Info
      </h4>
      <div className="text-xs space-y-1">
        <div>Module: {module}</div>
        <div>CSS Class: .module-{module}</div>
        <div style={{ color: 'var(--module-primary)' }}>
          Primary Color: var(--module-primary)
        </div>
        <div style={{ color: 'var(--module-light)' }}>
          Light Color: var(--module-light)
        </div>
        <div style={{ color: 'var(--module-dark)' }}>
          Dark Color: var(--module-dark)
        </div>
        <div 
          className="p-2 rounded mt-2" 
          style={{ backgroundColor: 'var(--module-surface)' }}
        >
          Surface Color Test
        </div>
      </div>
    </div>
  );
};

export default ModuleDebugger;
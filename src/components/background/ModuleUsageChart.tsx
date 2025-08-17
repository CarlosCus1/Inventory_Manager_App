import React from 'react';
import { formatPercentage } from '../../stringFormatters';

interface ModuleStat {
  name: string;
  usage: number;
  color: string;
}

interface ModuleUsageChartProps {
  stats: ModuleStat[];
}

const ModuleUsageChart: React.FC<ModuleUsageChartProps> = ({ stats }) => {
  return (
    <div className="space-y-3">
      {stats.map((module) => (
        <div key={module.name} className="flex items-center gap-3">
          <div className="w-16 text-xs font-medium text-gray-700 dark:text-gray-300">
            {module.name}
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-1000 ease-out relative"
              style={{
                width: `${module.usage}%`,
                backgroundColor: module.color,
                boxShadow: `inset 0 1px 2px rgba(0,0,0,0.1), 0 0 8px ${module.color}40`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="w-10 text-xs text-right font-mono text-gray-600 dark:text-gray-400">
            {formatPercentage(module.usage)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModuleUsageChart;
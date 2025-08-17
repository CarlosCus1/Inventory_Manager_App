import React from 'react';
import { formatPercentage } from '../../stringFormatters';

interface ModuleStat {
  name: string;
  usage: number;
  color: string;
}

interface CircularProgressChartProps {
  stats: ModuleStat[];
}

const CircularProgressChart: React.FC<CircularProgressChartProps> = ({ stats }) => {
  const averageUsage = Math.round(stats.reduce((acc, m) => acc + m.usage, 0) / stats.length);

  return (
    <div className="relative">
      <svg width="140" height="140" className="animate-spin-slow">
        {stats.map((module, index) => (
          <circle
            key={module.name}
            cx="70"
            cy="70"
            r="50"
            fill="none"
            stroke={module.color}
            strokeWidth="6"
            strokeDasharray={`${module.usage * 3.14} 314`}
            transform={`rotate(${index * 72} 70 70)`}
            className="opacity-60 hover:opacity-100 transition-opacity"
            style={{ 
              filter: `drop-shadow(0 0 8px ${module.color}40)` 
            }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs font-bold text-gray-600 dark:text-gray-300">
            Sistema
          </div>
          <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {formatPercentage(averageUsage)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularProgressChart;
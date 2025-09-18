import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import ModuleUsageChart from './ModuleUsageChart';
import FloatingParticles from './FloatingParticles';
import CircularProgressChart from './CircularProgressChart';

interface ModuleStat {
  name: string;
  usage: number;
  color: string;
}

interface InteractiveBackgroundProps {
  moduleStats: ModuleStat[];
  particleColors: string[];
  className?: string;
}

const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ 
  moduleStats, 
  particleColors 
}) => {
  const moduleUsage = useAppStore((state) => state.moduleUsage);

  // Update stats with current usage from store
  const currentStats = moduleStats.map(stat => ({
    ...stat,
    usage: moduleUsage[stat.name.toLowerCase() as keyof typeof moduleUsage] || stat.usage
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating particles */}
      <FloatingParticles colors={particleColors} />

      {/* Statistics panel */}
      <div className="absolute top-20 right-4 w-72 p-4 bg-white/10 dark:bg-gray-900/20 backdrop-blur-md rounded-xl border border-white/20 dark:border-gray-700/30 z-10">
        <h3 className="text-sm font-bold mb-3 text-gray-800 dark:text-gray-200">
          📊 Uso de Módulos
        </h3>
        <ModuleUsageChart stats={currentStats} />
      </div>

      {/* Circular progress chart */}
      <div className="absolute bottom-20 left-4 z-10">
        <CircularProgressChart stats={currentStats} />
      </div>
    </div>
  );
};

export default InteractiveBackground;
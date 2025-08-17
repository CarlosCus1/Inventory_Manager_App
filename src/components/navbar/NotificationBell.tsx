import React from 'react';
import { useAppStore } from '../../store/useAppStore';

const NotificationBell: React.FC = () => {
  const incompleteTasks = useAppStore((state) => state.incompleteTasks);
  const completeTask = useAppStore((state) => state.completeTask);

  return (
    <div className="relative">
      <button
        onClick={completeTask}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
        title={`${incompleteTasks} tareas pendientes`}
      >
        <svg 
          className="w-5 h-5 group-hover:animate-pulse" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-5 5-5-5h5V3h0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12l2 2 4-4" 
          />
        </svg>
        {incompleteTasks > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            {incompleteTasks}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationBell;
import { useAppStore } from '../../store/useAppStore';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.setTheme);

  const handleToggle = () => {
    toggleTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button 
      onClick={handleToggle}
      className={`p-2 rounded-full transition-colors duration-200 ${
        theme === 'light' 
          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      }`}
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;

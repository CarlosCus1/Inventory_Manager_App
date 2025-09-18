import { useAppStore } from '../store/useAppStore';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.setTheme);

  const handleToggle = () => {
    toggleTheme(theme === 'light' ? 'dark' : 'light');
  };

  const style = {
    backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
  };

  return (
    <button onClick={handleToggle} className="p-2 rounded-full transition-colors duration-200" style={style}>
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;

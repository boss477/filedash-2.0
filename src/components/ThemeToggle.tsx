
// React core import
import React from 'react';

// Icon imports
import { Moon, Sun } from 'lucide-react';

// UI component imports
import { Button } from '@/components/ui/button';

// Context imports
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center space-x-2"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </>
      )}
    </Button>
  );
};

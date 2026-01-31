
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useLocalStorageTheme = (): [Theme, (theme: Theme) => void] => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const item = window.localStorage.getItem('prompt-finance-theme');
      // Handle potential JSON stringified values (e.g. "light" vs light)
      const cleanItem = item ? item.replace(/"/g, '') : null;

      if (cleanItem === 'light' || cleanItem === 'dark') {
        return cleanItem as Theme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      console.error(error);
      return 'light';
    }
  });

  const setTheme = (newTheme: Theme) => {
    try {
      // Store unquoted string for simplicity and consistency with anti-flash script
      window.localStorage.setItem('prompt-finance-theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error(error);
    }
  };

  return [theme, setTheme];
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useLocalStorageTheme();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

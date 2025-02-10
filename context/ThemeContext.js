'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => null,
});

const THEME_COLORS = {
  light: {
    background: '#ffffff',
    theme: '#ffffff'
  },
  dark: {
    background: '#020817',
    theme: '#020817'
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const updateThemeColors = (newTheme) => {
    // Update meta tags
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const manifestLink = document.querySelector('link[rel="manifest"]');
    
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', THEME_COLORS[newTheme].theme);
    }

    // Update manifest link
    if (manifestLink) {
      manifestLink.href = `/manifest.json?theme=${newTheme}`;
    }
  };

  useEffect(() => {
    // Check localStorage first
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.className = storedTheme;
      updateThemeColors(storedTheme);
    } else {
      // If no stored preference, check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      localStorage.setItem('theme', initialTheme);
      document.documentElement.className = initialTheme;
      updateThemeColors(initialTheme);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.className = newTheme;
      updateThemeColors(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
    updateThemeColors(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

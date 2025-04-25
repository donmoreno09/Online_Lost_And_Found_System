import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // If no theme is saved, use system preference
    return 'system';
  };
  
  const [theme, setTheme] = useState(getInitialTheme());
  
  // Function to apply theme to DOM
  const applyTheme = (newTheme) => {
    // First remove the class to ensure clean state
    document.body.classList.remove('dark-theme');
    
    // If theme is 'system', check system preference
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('dark-theme');
      }
    } else if (newTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }
    // For light theme, we already removed 'dark-theme' class
  };
  
  // Apply theme when component mounts or theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    
    // Listen for changes in system preference
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => applyTheme('system');
      
      // Use the correct event listener method based on browser support
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
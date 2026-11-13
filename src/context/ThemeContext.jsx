import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('leadsarrow_theme') || localStorage.getItem('leadsarrow_landing_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark'; // default to modern dark mode
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      localStorage.setItem('leadsarrow_theme', theme);
      localStorage.setItem('leadsarrow_landing_theme', theme);
    } catch {}

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#f8fafc';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // If browser supports native View Transitions, sweep smoothly from top to bottom!
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.startViewTransition(() => {
        setTheme(nextTheme);
        const root = document.documentElement;
        if (nextTheme === 'dark') {
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
          document.body.classList.add('dark');
          document.body.style.backgroundColor = '#0f172a';
          document.body.style.color = '#f8fafc';
        } else {
          root.classList.remove('dark');
          root.setAttribute('data-theme', 'light');
          document.body.classList.remove('dark');
          document.body.style.backgroundColor = '#f8fafc';
          document.body.style.color = '#0f172a';
        }
      });
    } else {
      // Fallback: synchronous atomic change in the exact same frame
      setTheme(nextTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

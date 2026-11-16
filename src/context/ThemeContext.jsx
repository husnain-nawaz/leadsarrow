import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';

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

  const applyThemeToDom = (targetTheme) => {
    const root = document.documentElement;
    if (targetTheme === 'dark') {
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
  };

  useEffect(() => {
    try {
      localStorage.setItem('leadsarrow_theme', theme);
      localStorage.setItem('leadsarrow_landing_theme', theme);
    } catch {}
    applyThemeToDom(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // Temporarily suppress all element-level CSS color transitions during theme toggle.
    // This stops font and background colors from interpolating to the same middle-gray
    // simultaneously, which caused text to disappear/fade out for several hundred milliseconds.
    const disableTransitionsStyle = document.createElement('style');
    disableTransitionsStyle.appendChild(
      document.createTextNode(
        `*, *::before, *::after {
          -webkit-transition: none !important;
          -moz-transition: none !important;
          -o-transition: none !important;
          -ms-transition: none !important;
          transition: none !important;
        }`
      )
    );
    document.head.appendChild(disableTransitionsStyle);

    const cleanupTransitions = () => {
      // Force layout reflow before removing the transition suppression
      if (typeof window !== 'undefined') {
        window.getComputedStyle(document.body);
      }
      setTimeout(() => {
        if (document.head.contains(disableTransitionsStyle)) {
          document.head.removeChild(disableTransitionsStyle);
        }
      }, 50);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme);
          applyThemeToDom(nextTheme);
        });
      });

      if (transition && transition.finished) {
        transition.finished.finally(cleanupTransitions);
      } else {
        cleanupTransitions();
      }
    } else {
      setTheme(nextTheme);
      applyThemeToDom(nextTheme);
      cleanupTransitions();
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

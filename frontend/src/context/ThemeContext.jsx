import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'theme';

// The boot script in index.html resolves the initial theme (stored choice, else
// OS preference) and sets data-theme before paint. Mirror its decision so the
// context state matches what's already on screen.
function getInitialTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // An explicit choice is persisted and overrides the OS preference.
  const setTheme = useCallback((next) => {
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage blocked */ }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Follow live OS theme changes until the user makes an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      let stored = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
      if (stored) return; // explicit choice wins over the OS
      const next = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setThemeState(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

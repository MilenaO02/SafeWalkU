import { useState, useEffect } from 'react';

/**
 * Shared dark-mode hook.
 *
 * Reads and writes the "theme" key in localStorage so that the
 * login page, main layout, and any other consumer all stay in sync
 * on the same tab.  Falls back to the OS preference on first visit.
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggle = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggle, setIsDarkMode };
}

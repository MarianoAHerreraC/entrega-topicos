// FILE: src/hooks/useDarkMode.ts
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useDarkMode(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  useEffect(() => {
    // Intenta leer la preferencia del usuario desde el almacenamiento local
    const localTheme = window.localStorage.getItem('theme') as Theme | null;
    if (localTheme) {
      setTheme(localTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Si no hay preferencia, usa la del sistema operativo
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Guarda la preferencia para futuras visitas
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, toggleTheme];
}
import React, { createContext, useContext, useState } from 'react';

const Ctx = createContext({ theme: 'light', setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const apply = (t) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.style.colorScheme = t;
    try {
      localStorage.setItem('rf_theme', t);
    } catch (e) {}
    setThemeState(t);
  };
  const toggle = () => apply(theme === 'dark' ? 'light' : 'dark');
  return <Ctx.Provider value={{ theme, setTheme: apply, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

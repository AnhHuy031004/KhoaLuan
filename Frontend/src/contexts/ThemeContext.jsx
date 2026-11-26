import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useEffect,
  useState,
} from 'react';

const Context = createContext(null);
const themes = ['light', 'dark'];
const valid = (v) => (themes.includes(v) ? v : 'dark');

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('vovinam-night-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const sync = (e) => {
      if (e.key === 'vovinam-night-theme') setTheme(valid(e.newValue));
    };
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
    };
  }, []);

  useLayoutEffect(() => {
    const resolved = valid(theme);
    document.documentElement.dataset.theme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'light' ? '#eef3f8' : '#081224');
    try {
      localStorage.setItem('vovinam-night-theme', resolved);
    } catch (error) {
      console.warn('Không thể lưu lựa chọn giao diện:', error.name);
    }
  }, [theme]);

  return (
    <Context.Provider
      value={{
        theme,
        setTheme: (next) => setTheme(valid(next)),
        toggle: () => setTheme((v) => (v === 'light' ? 'dark' : 'light')),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useTheme = () => useContext(Context);

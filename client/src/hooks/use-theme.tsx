
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Verificar si hay un tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Si no hay tema guardado, usar la preferencia del sistema
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remover todas las clases de tema anteriores
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // Agregar la nueva clase de tema al root y body
    root.classList.add(theme);
    body.classList.add(theme);
    
    // También aplicar el atributo data-theme para compatibilidad
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);
    
    // Forzar actualización de variables CSS
    root.style.setProperty('color-scheme', theme);
    
    // Guardar en localStorage
    localStorage.setItem('theme', theme);
    
    // Log para debugging
    console.log('Tema aplicado:', theme, 'Clases en root:', root.classList.toString());
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(theme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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

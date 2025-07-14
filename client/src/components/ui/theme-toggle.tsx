
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    const currentTheme = theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    console.log('Estado actual del tema:', {
      currentTheme,
      newTheme,
      rootClasses: document.documentElement.classList.toString(),
      bodyClasses: document.body.classList.toString(),
      localStorage: localStorage.getItem('theme')
    });
    
    toggleTheme();
    
    // Verificar después del cambio
    setTimeout(() => {
      console.log('Estado después del cambio:', {
        theme: localStorage.getItem('theme'),
        rootClasses: document.documentElement.classList.toString(),
        bodyClasses: document.body.classList.toString(),
      });
    }, 100);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="h-10 w-10 p-0 hover:bg-gradient-to-r hover:from-[var(--jasana-accent)]/10 hover:to-[var(--jasana-primary)]/10 transition-all duration-200"
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 transition-all duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 transition-all duration-200 hover:rotate-12" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}

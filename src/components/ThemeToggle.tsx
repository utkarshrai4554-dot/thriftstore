import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThemeToggle = ({ position = "fixed" }: { position?: "fixed" | "inline" }) => {
  const { theme, toggleTheme } = useTheme();

  const baseClasses = "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110";
  const darkModeClasses = "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0";
  const lightModeClasses = "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0";
  
  const positionClasses = position === "fixed" 
    ? "fixed top-4 right-4 z-[100]" 
    : "inline-flex";

  return (
    <div className={positionClasses}>
      <Button
        onClick={toggleTheme}
        size="sm"
        className={`${baseClasses} ${theme === 'dark' ? darkModeClasses : lightModeClasses}`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default ThemeToggle;

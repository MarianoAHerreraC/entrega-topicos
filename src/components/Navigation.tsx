import { Home, BarChart2, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle"; // <-- 1. IMPORTAMOS EL NUEVO COMPONENTE

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "analysis", label: "Análisis", icon: BarChart2 }, // Corregido a BarChart2 para que coincida con tu código
  { id: "history", label: "Historial", icon: History },
  { id: "settings", label: "Configuración", icon: Settings },
];

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border shadow-soft z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">💰</span>
            </div>
              <span className="font-bold text-2xl text-gray-900 dark:text-white drop-shadow">Billetera Inteligente</span>
          </div>
          
          {/* Contenedor para los elementos de la derecha */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth font-medium",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* --- 2. AÑADIMOS EL BOTÓN AQUÍ --- */}
            <ThemeToggle />
            
          </div>
        </div>
      </div>
    </nav>
  );
};
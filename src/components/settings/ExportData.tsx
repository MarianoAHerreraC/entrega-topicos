import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const ExportData = () => {
  // --- CONFIGURACIÓN ---
  // Pega la URL BASE de tu API de Replit aquí
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  // --------------------

  // Construimos la URL completa para la exportación
  const exportUrl = `${API_BASE_URL}/export`;

  return (
    <Card className="p-6 shadow-soft dark:bg-slate-800 dark:border dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-2 dark:text-slate-200">Exportar Datos</h3>
      <p className="text-sm text-muted-foreground mb-4 dark:text-slate-400">
        Descarga todas tus transacciones en formato CSV para análisis externo o respaldo.
      </p>
      
      {/* El botón ahora está dentro de un enlace (<a>) que apunta a la URL de exportación */}
      <a href={exportUrl} download>
        <Button className="w-full md:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Exportar a CSV
        </Button>
      </a>
    </Card>
  );
};
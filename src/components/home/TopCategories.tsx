import { Transaction } from "@/types";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";

interface CategoryTotal {
  category: string;
  amount: number;
}

const CATEGORIAS_A_MOSTRAR = [
    'hogar', 'transporte', 'comida', 'servicios', 'entretenimiento', 
    'supermercado', 'salud', 'educación', 'ropa', 'tecnología'
];

export const TopCategories = () => {
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const API_URL = "https://entrega-topicos-backend.onrender.com/api/expenses/8323618720";

    const fetchDataAndProcess = async () => {
      try {
        const response = await axios.get<Transaction[]>(API_URL);
        const allTransactions = response.data;

        const summary: { [key: string]: number } = {};
        CATEGORIAS_A_MOSTRAR.forEach(cat => { summary[cat.toLowerCase()] = 0; });

        allTransactions.forEach(transaction => {
          const categoryKey = transaction.category.toLowerCase();
          if (summary.hasOwnProperty(categoryKey)) {
            summary[categoryKey] += transaction.amount;
          }
        });

        const processedTotals = Object.entries(summary).map(([category, amount]) => ({ category, amount }));
        setCategoryTotals(processedTotals);

      } catch (error) {
        console.error("Error al procesar las categorías:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDataAndProcess();
  }, []);
  
  if (loading) { 
    return (
      <Card className="p-4 flex flex-col flex-grow dark:bg-slate-800">
        <h3 className="text-base font-semibold border-b pb-4 dark:border-slate-700 dark:text-slate-200">Resumen por Categoría</h3>
        <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground dark:text-slate-400">Cargando...</p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      className="shadow-soft rounded-lg bg-card dark:bg-slate-800 dark:border dark:border-slate-700 flex flex-col flex-grow"
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div className="p-4 border-b dark:border-slate-700">
        <h3 className="text-base font-semibold dark:text-slate-200">Resumen por Categoría</h3>
      </div>
      <div className="p-4 space-y-1 flex-grow">
        {categoryTotals.map((cat) => (
          <div key={cat.category} className="flex justify-between py-0.5">
            <span className="capitalize dark:text-slate-200 font-normal">{cat.category}</span>
            <span className="font-bold text-right text-foreground dark:text-slate-50 text-sm">
              ${cat.amount.toLocaleString("es-AR", { minimumFractionDigits: 0, useGrouping: true })}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
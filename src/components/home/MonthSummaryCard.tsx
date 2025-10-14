// FILE: src/components/home/MonthSummaryCard.tsx (CORREGIDO CON FILTRO DE FECHA)
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Transaction } from "@/types";
import { motion } from "framer-motion";
import { isThisMonth, parseISO } from 'date-fns'; // <-- 1. IMPORTAMOS LA FUNCIÓN DE FECHA

export const MonthSummaryCard = () => {
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const API_URL = "https://entrega-topicos-backend.onrender.com/api/expenses/8323618720";

    const fetchAndCalculate = async () => {
      try {
        const response = await axios.get<Transaction[]>(API_URL);
        const allTransactions = response.data;

        // --- 2. FILTRAMOS SOLO LOS GASTOS DE ESTE MES ---
        const thisMonthTransactions = allTransactions.filter(t => 
          isThisMonth(parseISO(t.date))
        );

        // 3. Calculamos el total solo con los gastos filtrados
        const totalDeEsteMes = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        setTotalSpent(totalDeEsteMes);

      } catch (error) {
        console.error("Error al calcular el resumen del mes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndCalculate();
  }, []);

  if (loading) { /* ... */ }

  return (
    <motion.div
      className="sticky top-0 z-20 mx-auto w-full max-w-2xl bg-gradient-to-r from-gray-100 to-blue-100 dark:from-blue-900 dark:via-blue-800 dark:to-blue-900 rounded-xl shadow-lg border border-gray-200 dark:border-blue-900 transition-shadow py-8 mb-4"
      // ... (El código de la animación y el estilo se mantiene igual)
    >
      <div className="pb-2 border-b border-gray-300 dark:border-blue-700 text-center">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white drop-shadow">Gasto mensual total</h3>
      </div>
      <div className="pt-4 text-center">
        <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg">${totalSpent.toLocaleString('es-AR')}</h2>
      </div>
    </motion.div>
  );
};
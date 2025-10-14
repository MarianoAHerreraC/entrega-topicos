import { useState, useEffect } from 'react';
import axios from 'axios';
import { Transaction } from "@/types";
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailyTotal {
  name: string;
  total: number;
}

export const RecentActivityChart = () => {
  const [data, setData] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const API_URL = "https://entrega-topicos-backend.onrender.com/api/expenses/8323618720";

    const fetchDataAndProcess = async () => {
      try {
        const response = await axios.get<Transaction[]>(API_URL);
        const allTransactions = response.data;
        const sevenDaysAgo = subDays(new Date(), 7);

        const recentTxs = allTransactions.filter(t => isAfter(parseISO(t.date), sevenDaysAgo));

        const dailyTotals: Record<string, number> = {};
        recentTxs.forEach(t => {
          const dayName = format(parseISO(t.date), "eee", { locale: es });
          const dateKey = format(parseISO(t.date), "yyyy-MM-dd");
          const key = `${dateKey}_${dayName}`;
          dailyTotals[key] = (dailyTotals[key] || 0) + t.amount;
        });

        const chartData = Object.entries(dailyTotals)
          .map(([key, total]) => ({
            fullDate: key.split('_')[0],
            name: key.split('_')[1],
            total,
          }))
          .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

        setData(chartData);

      } catch (error) {
        console.error("Error al procesar datos para el gráfico:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDataAndProcess();
  }, []);

  if (loading) { 
    return (
        <Card className="p-4 h-full flex flex-col dark:bg-slate-800">
            <h3 className="text-base font-semibold border-b pb-4 dark:border-slate-700 dark:text-slate-200">Actividad de la Última Semana</h3>
            <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground dark:text-slate-400">Cargando...</p>
            </div>
        </Card>
    );
  }

  return (
    <motion.div
      className="h-full shadow-soft rounded-lg bg-card dark:bg-slate-800 dark:border dark:border-slate-700 flex flex-col"
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div className="p-4 border-b dark:border-slate-700">
        <h3 className="text-base font-semibold dark:text-slate-200">Actividad de la Última Semana</h3>
      </div>
      <div className="p-4 flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip
              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "0.5rem" }}
              labelStyle={{ color: "#d1d5db" }}
              formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, "Total"]}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

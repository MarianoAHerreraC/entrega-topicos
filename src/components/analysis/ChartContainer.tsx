import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Transaction, CategorySpending } from "@/types";
import { getCategoryColor } from "@/utils/categoryColors";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

type ChartContainerProps = {
  selectedPeriod: "current" | "last" | "90days";
};

interface DailyData {
  date: string;
  amount: number;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ selectedPeriod }) => {
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [loading, setLoading] = useState(true)
  const isDarkMode = false; // Ajusta según tu lógica de dark mode

  useEffect(() => {
  const API_URL = `${import.meta.env.VITE_API_URL}/api/expenses/8323618720`;
    const fetchDataAndProcess = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Transaction[]>(API_URL);
        const allTransactions = response.data;

        // --- LÓGICA PARA FILTRAR POR FECHA ---
        const now = new Date();
        let start: Date, end: Date;

        if (selectedPeriod === 'current') {
          start = startOfMonth(now); end = endOfMonth(now);
        } else if (selectedPeriod === 'last') {
          const lastMonth = subMonths(now, 1);
          start = startOfMonth(lastMonth); end = endOfMonth(lastMonth);
        } else { // 90days
          start = subDays(now, 90); end = now;
        }

        const filteredTxs = allTransactions.filter(t => 
            isWithinInterval(parseISO(t.date), { start, end })
        );
        // --- FIN DEL FILTRADO ---

        // Lógica para el gráfico de torta (usa filteredTxs)
        const categoryTotals: Record<string, number> = {};
        let grandTotal = 0;
        filteredTxs.forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
          grandTotal += t.amount;
        });
        const processedCategoryData = Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
            color: getCategoryColor(category)
          }))
          .sort((a, b) => b.amount - a.amount);
        setCategoryData(processedCategoryData);

        // Lógica para el gráfico de barras (usa filteredTxs y ordena correctamente)
        const dailyTotals: Record<string, number> = {};
        filteredTxs.forEach(t => {
          const day = format(parseISO(t.date), "dd/MM");
          dailyTotals[day] = (dailyTotals[day] || 0) + t.amount;
        });
        const processedDailyData = Object.entries(dailyTotals)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => {
            const [dayA, monthA] = a.date.split('/');
            const [dayB, monthB] = b.date.split('/');
            if (monthA !== monthB) return Number(monthA) - Number(monthB);
            return Number(dayA) - Number(dayB);
          });
        setDailyData(processedDailyData);

      } catch (error) {
        console.error("Error al obtener datos para los gráficos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndProcess();
  }, [selectedPeriod]);

  if (loading) {
    return <p className="text-center text-muted-foreground dark:text-slate-400">Cargando gráficos...</p>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-4 shadow-soft dark:bg-slate-800">
        <h4 className="font-semibold mb-4 text-center dark:text-slate-200">Desglose por Categoría</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={categoryData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label fill="#8884d8">
              {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    const { name, value } = payload[0];
                    return (
                      <div style={{ background: 'transparent', color: '#fff', border: 'none', boxShadow: 'none', padding: 8, fontWeight: 500 }}>
                        {name} : ${value.toLocaleString('es-AR')}
                      </div>
                    );
                  }
                  return null;
                }}
              />
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card className="p-4 shadow-soft dark:bg-slate-800">
        <h4 className="font-semibold mb-4 text-center dark:text-slate-200">Gasto por Día</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <XAxis dataKey="date" stroke="#888888" fontSize={12} />
            <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.95)', color: '#222', border: 'none', boxShadow: 'none', padding: 8, fontWeight: 500, borderRadius: 6 }}>
                      <div>{label}</div>
                      <div>Total : ${payload[0].value.toLocaleString('es-AR')}</div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
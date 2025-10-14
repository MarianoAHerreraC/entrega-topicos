import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from "@/components/ui/card";
import { Transaction, CategorySpending } from "@/types";
import { getCategoryColor } from "@/utils/categoryColors";

type SummaryTableProps = {
  selectedPeriod: "current" | "last" | "90days";
};

export const SummaryTable: React.FC<SummaryTableProps> = ({ selectedPeriod }) => {
  const [data, setData] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const API_URL = "https://entrega-topicos-backend.onrender.com/api/expenses/8323618720";

    const fetchDataAndProcess = async () => {
      try {
        const response = await axios.get<Transaction[]>(API_URL);
        const transactions = response.data;

        const categoryTotals: Record<string, number> = {};
        let grandTotal = 0;
        transactions.forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
          grandTotal += t.amount;
        });

        const processedData = Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
            color: getCategoryColor(category)
          }))
          .sort((a, b) => b.amount - a.amount);
        
        setData(processedData);

      } catch (error) {
        console.error("Error al obtener datos para la tabla:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDataAndProcess();
  }, []);

  if (loading) {
    return <p>Cargando tabla de resumen...</p>;
  }

  return (
    <Card className="shadow-soft overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-4 font-semibold">Categoría</th>
            <th className="p-4 font-semibold">Monto Gastado</th>
            <th className="p-4 font-semibold">% del Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.category} className="border-b last:border-b-0">
              <td className="p-4 flex items-center">
                <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
                {item.category}
              </td>
              <td className="p-4">${item.amount.toLocaleString('es-AR')}</td>
              <td className="p-4">{item.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};
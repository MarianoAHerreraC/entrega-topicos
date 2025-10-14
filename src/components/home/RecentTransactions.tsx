import { useState, useEffect } from 'react';
import axios from 'axios';
import { Transaction } from "@/types";
import { format, parseISO, isThisMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface RecentTransactionsProps {
  onViewAll: () => void;
}

export const RecentTransactions = ({ onViewAll }: RecentTransactionsProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const API_URL = `${import.meta.env.VITE_API_URL}/api/expenses/8323618720`;

    const fetchTransactions = async () => {
      try {
        const response = await axios.get<Transaction[]>(API_URL);
        const allTransactions = response.data;
        const thisMonthTransactions = allTransactions.filter(t => isThisMonth(parseISO(t.date)));
        setTransactions(thisMonthTransactions);
      } catch (error) {
        console.error("Error al obtener las transacciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
      return (
        <Card className="p-4 flex flex-col h-full dark:bg-slate-800">
            <h3 className="text-base font-semibold border-b pb-4 dark:border-slate-700 dark:text-slate-200">Últimos Movimientos</h3>
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
        <h3 className="text-base font-semibold dark:text-slate-200">Últimos Movimientos</h3>
      </div>
      <div className="p-4 space-y-4 flex-grow">
        {transactions.slice(0, 6).map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between"
          >
            <div className="flex-1">
              <p className="font-medium text-foreground dark:text-slate-50 text-sm">{transaction.description || transaction.category}</p>
              <p className="text-xs text-muted-foreground capitalize dark:text-slate-400">
                {transaction.category}
                {transaction.payment_method && ` • ${transaction.payment_method}`}
              </p>
            </div>
            <span className={cn("font-semibold whitespace-nowrap text-sm", "text-destructive dark:text-red-400")}>
              -${transaction.amount.toLocaleString("es-AR")}
            </span>
          </div>
        ))}
      </div>
      <Button
        onClick={onViewAll}
        variant="ghost"
        className="w-full mt-auto text-primary hover:text-primary-hover dark:text-slate-200 dark:hover:text-white text-sm"
      >
        Ver Historial Completo
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
};
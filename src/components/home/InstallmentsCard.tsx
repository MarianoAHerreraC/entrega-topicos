// FILE: src/components/home/InstallmentsCard.tsx (VERSIÓN CORREGIDA)
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Transaction } from "@/types";
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { format, isFuture, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface UpcomingInstallment {
  id: string;
  description: string;
  details: string;
  date: string;
  amount: number;
}

export const InstallmentsCard = () => {
  const [upcoming, setUpcoming] = useState<UpcomingInstallment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const API_URL = `${import.meta.env.VITE_API_URL}/api/expenses/8323618720`;

    const fetchAndProcess = async () => {
      try {
        const response = await axios.get<Transaction[]>(API_URL);
        const allTransactions = response.data;

        const installmentTxs = allTransactions.filter(t => t.installment_plan_id);

        const plans: Record<string, Transaction[]> = {};
        installmentTxs.forEach(tx => {
          const planId = tx.installment_plan_id!;
          if (!plans[planId]) { plans[planId] = []; }
          plans[planId].push(tx);
        });

        const nextInstallments: UpcomingInstallment[] = [];
        Object.values(plans).forEach(planTxs => {
          // --- LÓGICA CORREGIDA ---
          // 1. Ordenamos las cuotas de un plan por fecha, de la más vieja a la más nueva
          const sortedPlanTxs = planTxs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // 2. Buscamos la primera cuota cuya fecha sea hoy o en el futuro
          const nextTx = sortedPlanTxs.find(tx => {
            const txDate = parseISO(tx.date);
            return isToday(txDate) || isFuture(txDate);
          });

          if (nextTx) {
            nextInstallments.push({
              id: nextTx.id,
              description: nextTx.description || nextTx.category,
              details: nextTx.installment_details || '',
              date: nextTx.date,
              amount: nextTx.amount,
            });
          }
        });

        nextInstallments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setUpcoming(nextInstallments);

      } catch (error) {
        console.error("Error al procesar las cuotas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcess();
  }, []);
  
  if (loading || upcoming.length === 0) { return null; }

  return (
    <motion.div
      className="shadow-soft rounded-lg bg-card dark:bg-slate-800 dark:border dark:border-slate-700"
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div className="p-4 border-b dark:border-slate-700">
        <h3 className="text-base font-semibold dark:text-slate-200">Próximas Cuotas</h3>
      </div>
      <div className="p-4 space-y-4">
        {upcoming.slice(0, 4).map((item) => (
          <div key={item.id} className="text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium capitalize dark:text-slate-200">{item.description}</p>
              <span className="font-semibold dark:text-slate-200">${item.amount.toLocaleString("es-AR")}</span>
            </div>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              {item.details} • Vence: {format(parseISO(item.date), "d 'de' MMMM", { locale: es })}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
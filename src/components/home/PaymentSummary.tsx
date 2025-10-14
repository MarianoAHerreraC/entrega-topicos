import { useEffect, useState } from "react";
import axios from "axios";
import { Transaction } from "@/types";
import { motion } from "framer-motion";

const normalizeMethod = (method: string) => {
  const m = method.trim().toLowerCase();
  if (m === "credito" || m === "crédito") return "Crédito";
  if (m === "debito" || m === "débito") return "Débito";
  if (m === "efectivo") return "Efectivo";
  if (m === "mercadopago") return "MercadoPago";
  return m.charAt(0).toUpperCase() + m.slice(1);
};

export const PaymentSummary = () => {
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const API_URL = "https://entrega-topicos-backend.onrender.com/api/expenses/8323618720";
    axios.get<Transaction[]>(API_URL).then(res => {
      const data = res.data;
      const grouped: Record<string, number> = {};
      data.forEach(tx => {
        const rawMethod = tx.payment_method || "Sin especificar";
        const method = normalizeMethod(rawMethod);
        grouped[method] = (grouped[method] || 0) + tx.amount;
      });
      setSummary(grouped);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-4">Cargando resumen...</div>;

  return (
    <motion.div
      className="shadow-soft rounded-lg bg-card dark:bg-slate-800 dark:border dark:border-slate-700"
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div className="p-4 border-b dark:border-slate-700">
        <h3 className="text-base font-semibold dark:text-slate-200">Resumen por método de pago</h3>
      </div>
      <div className="p-4">
        <ul>
          {Object.entries(summary).map(([method, amount]) => (
            <li key={method} className="flex justify-between py-1">
              <span>{method}</span>
              <span className="font-semibold text-right text-foreground dark:text-slate-50">
                ${amount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

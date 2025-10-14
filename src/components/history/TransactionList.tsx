import { useState, useEffect } from 'react';
import axios from 'axios';
import { Transaction } from "@/types";
import { format, parseISO, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const TransactionList = () => {
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // --- CONFIGURACIÓN ---
  const API_BASE_URL = 'http://localhost:5001'; 
  const USER_ID = '8323618720';
  // --------------------

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get<Transaction[]>(`${API_BASE_URL}/api/expenses/${USER_ID}`);
        const allTransactions = response.data;
        const pastAndPresentTxs = allTransactions.filter(t => !isFuture(parseISO(t.date)));
        setTransactions(pastAndPresentTxs);
      } catch (error) {
        console.error("Error al obtener el historial:", error);
        toast.error("No se pudo cargar el historial.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este gasto?")) { return; }
    try {
      await axios.delete(`${API_BASE_URL}/api/expenses/${Number(id)}`);
      setTransactions(currentTransactions => currentTransactions.filter(t => t.id !== id));
      toast.success("Gasto eliminado con éxito.");
    } catch (error) {
      console.error("Error al eliminar la transacción:", error);
      toast.error("No se pudo eliminar el gasto.");
    }
  };

  const handleEdit = (transaction: Transaction) => {
  setEditTx(transaction);
  setEditAmount(String(transaction.amount));
  setEditPayment(transaction.payment_method || "");
  };
  
  if (loading) {
    return <p className="text-center text-muted-foreground">Cargando historial...</p>;
  }

  // --- CORRECCIÓN EN LA LÓGICA DE AGRUPACIÓN Y ORDENAMIENTO ---
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    // 1. Agrupamos por fecha en formato 'YYYY-MM-DD' que es ordenable
    const dayKey = format(parseISO(transaction.date), "yyyy-MM-dd");
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // 2. Ordenamos las claves de fecha (ej: '2025-10-10') de más nueva a más vieja
  const sortedDayKeys = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));
  // --- FIN DE LA CORRECCIÓN ---

  return (
    <div className="space-y-8">
      {/* Modal de edición */}
      <Dialog open={!!editTx} onOpenChange={open => !open ? setEditTx(null) : null}>
        <DialogContent>
          <DialogHeader>
            <span className="font-bold text-lg">Editar gasto</span>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-1">Monto</label>
            <Input type="number" min={0} value={editAmount} onChange={e => setEditAmount(e.target.value)} />
            <label className="block text-sm font-medium mb-1">Medio de pago</label>
            <Select value={editPayment} onValueChange={setEditPayment}>
              <SelectTrigger><SelectValue placeholder="Selecciona un medio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Débito">Débito</SelectItem>
                <SelectItem value="Crédito">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              disabled={saving}
              onClick={async () => {
                if (!editTx) return;
                setSaving(true);
                try {
                  await axios.put(`${API_BASE_URL}/api/expenses/${Number(editTx.id)}`, {
                    ...editTx,
                    amount: Number(editAmount),
                    payment_method: editPayment,
                  });
                  setTransactions(current => current.map(t => t.id === editTx.id ? { ...t, amount: Number(editAmount), payment_method: editPayment } : t));
                  toast.success("Gasto editado con éxito.");
                  setEditTx(null);
                } catch (error) {
                  toast.error("No se pudo editar el gasto.");
                } finally {
                  setSaving(false);
                }
              }}
            >Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 3. Mapeamos sobre las fechas ya ordenadas */}
      {sortedDayKeys.map((dayKey) => {
        const transactionsOnDay = groupedTransactions[dayKey];
        // Formateamos la fecha solo para mostrarla en el título
        const dayTitle = format(parseISO(dayKey), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
        const capitalizedDay = dayTitle.charAt(0).toUpperCase() + dayTitle.slice(1);

        return (
          <div key={dayKey}>
            <h3 className="text-lg font-semibold mb-2 dark:text-slate-200">{capitalizedDay}</h3>
            <div className="bg-card rounded-lg shadow-soft overflow-hidden dark:bg-slate-800 dark:border dark:border-slate-700">
              {transactionsOnDay.map((transaction) => (
                <div key={transaction.id} className="flex items-center p-4 border-b last:border-b-0 dark:border-slate-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-muted-foreground dark:text-slate-400">
                        {format(parseISO(transaction.date), "HH:mm")}
                      </span>
                      <p className="font-medium text-foreground dark:text-slate-50">{transaction.description || transaction.category}</p>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize pl-12 dark:text-slate-400">
                      {transaction.category}
                      {transaction.payment_method && ` • ${transaction.payment_method}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <span className={cn("font-semibold whitespace-nowrap", "text-destructive dark:text-red-400")}>
                      -${transaction.amount.toLocaleString("es-AR")}
                    </span>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary dark:text-slate-400" onClick={() => handleEdit(transaction)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive/80 hover:text-destructive dark:text-red-500/80 dark:hover:text-red-400" onClick={() => handleDelete(transaction.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
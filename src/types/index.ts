// FILE: src/types.ts (VERSIÓN CON CUOTAS)

export interface Transaction {
  id: string;
  date: string;
  description: string | null;
  category: string;
  amount: number;
  user_id: string;
  payment_method: string | null;
  installment_plan_id?: string; // <-- NUEVO
  installment_details?: string; // <-- NUEVO
}

// ... (El resto de las interfaces se mantienen igual)
export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
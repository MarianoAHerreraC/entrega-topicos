import { Transaction, Category } from "@/types";
import { subDays, format } from "date-fns";

export const categories: Category[] = [
  { id: "1", name: "Alimentación", icon: "🍽️", color: "#10b981" },
  { id: "2", name: "Transporte", icon: "🚗", color: "#3b82f6" },
  { id: "3", name: "Entretenimiento", icon: "🎮", color: "#f59e0b" },
  { id: "4", name: "Salud", icon: "🏥", color: "#ef4444" },
  { id: "5", name: "Educación", icon: "📚", color: "#8b5cf6" },
  { id: "6", name: "Servicios", icon: "💡", color: "#06b6d4" },
  { id: "7", name: "Compras", icon: "🛍️", color: "#ec4899" },
  { id: "8", name: "Hogar", icon: "🏠", color: "#14b8a6" },
];

export const paymentMethods = [
  "Efectivo",
  "Tarjeta de Débito",
  "Tarjeta de Crédito",
  "Transferencia",
];

const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const today = new Date();

  const descriptions: Record<string, string[]> = {
    Alimentación: ["Supermercado", "Restaurante", "Cafetería", "Panadería", "Delivery comida"],
    Transporte: ["Uber", "Combustible", "Estacionamiento", "Peaje", "Taxi"],
    Entretenimiento: ["Netflix", "Cine", "Spotify", "Concierto", "Teatro"],
    Salud: ["Farmacia", "Consulta médica", "Gimnasio", "Dentista", "Vitaminas"],
    Educación: ["Libros", "Curso online", "Material escolar", "Universidad", "Tutorías"],
    Servicios: ["Electricidad", "Internet", "Agua", "Gas", "Teléfono"],
    Compras: ["Ropa", "Electrónica", "Accesorios", "Zapatos", "Perfume"],
    Hogar: ["Limpieza", "Decoración", "Reparaciones", "Muebles", "Electrodomésticos"],
  };

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = subDays(today, daysAgo);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryDescriptions = descriptions[category.name];
    const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
    const amount = Math.floor(Math.random() * 50000) + 500;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    transactions.push({
      id: `trans-${i + 1}`,
      description,
      amount,
      category: category.name,
      paymentMethod,
      date: format(date, "yyyy-MM-dd"),
      createdAt: date.toISOString(),
    });
  }

  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const mockTransactions = generateMockTransactions();

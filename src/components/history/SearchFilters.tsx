import { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction } from "@/types";

interface SearchFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  selectedPayment: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPaymentChange: (value: string) => void;
}

export const SearchFilters = ({ 
  searchTerm, 
  selectedCategory, 
  selectedPayment, 
  onSearchChange, 
  onCategoryChange, 
  onPaymentChange 
}: SearchFiltersProps) => {
  
  // Nuevo estado para guardar las categorías que vienen de la API
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  useEffect(() => {
    // Pega aquí la URL de tu API con tu ID de Telegram
  const API_URL = "https://entrega-topicos-backend.onrender.com/api/expenses/8323618720";
    
    const fetchCategories = async () => {
      try {
        const response = await axios.get<Transaction[]>(API_URL);
        const transactions = response.data;
        
        // Creamos una lista de categorías únicas a partir de todas las transacciones
        const uniqueCategories = [...new Set(transactions.map(t => t.category))];
        setAvailableCategories(uniqueCategories.sort());
        
      } catch (error) {
        console.error("Error al obtener las categorías para los filtros:", error);
      }
    };
    
    fetchCategories();
  }, []); // Se ejecuta solo una vez

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Input
        placeholder="Buscar por descripción..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder="Todas las categorías" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {/* Mapeamos las categorías obtenidas de la API */}
          {availableCategories.map(category => (
            <SelectItem key={category} value={category}>
              {/* Capitalizamos la primera letra para que se vea mejor */}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedPayment} onValueChange={onPaymentChange}>
        <SelectTrigger>
          <SelectValue placeholder="Todos los medios" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los medios</SelectItem>
          <SelectItem value="credit">Crédito</SelectItem>
          <SelectItem value="debit">Débito</SelectItem>
          <SelectItem value="cash">Efectivo</SelectItem>
          <SelectItem value="transfer">Transferencia</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
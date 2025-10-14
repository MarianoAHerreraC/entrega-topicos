import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Transaction } from "@/types";

// Definimos un tipo para la categoría
interface Category {
  id: string; // Usaremos el nombre como ID único
  name: string;
}

export const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // --- CONFIGURACIÓN ---
  const API_BASE_URL = 'URL_DE_TU_API_AQUI'; 
  const USER_ID = 'TU_ID_DE_TELEGRAM';
  // --------------------

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<Transaction[]>(`${API_BASE_URL}/api/expenses/${USER_ID}`);
        // Extraemos las categorías únicas de todas las transacciones
        const uniqueCategoryNames = [...new Set(response.data.map(t => t.category))];
        const formattedCategories = uniqueCategoryNames.map(name => ({ id: name, name }));
        setCategories(formattedCategories);
      } catch (error) {
        console.error("Error al obtener las categorías:", error);
        toast.error("No se pudo cargar la lista de categorías.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    if (newCategory.trim() === "") {
      toast.warning("El nombre de la categoría no puede estar vacío.");
      return;
    }
    const newCat: Category = {
      id: newCategory.trim().toLowerCase(),
      name: newCategory.trim(),
    };
    // Añadimos la nueva categoría a la lista en pantalla
    setCategories([...categories, newCat]);
    setNewCategory("");
    toast.success("Categoría agregada a la lista (temporalmente).");
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
    toast.success("Categoría eliminada de la lista.");
  };

  if (loading) {
    return <p>Cargando categorías...</p>;
  }

  return (
    <Card className="p-6 shadow-soft">
      <h3 className="text-lg font-semibold mb-4">Gestión de Categorías</h3>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Nombre de la nueva categoría..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button onClick={handleAddCategory}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <p className="font-medium capitalize">{category.name}</p>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
              <Trash2 className="w-4 h-4 text-destructive/80" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
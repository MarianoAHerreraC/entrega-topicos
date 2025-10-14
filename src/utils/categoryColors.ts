// src/utils/categoryColors.ts

export const CATEGORY_COLORS: Record<string, string> = {
  hogar: '#D7263D',
  transporte: '#1B998B',
  comida: '#F46036',
  servicios: '#2E294E',
  entretenimiento: '#E2C044',
  supermercado: '#6DD47E',
  salud: '#3A86FF',
  educación: '#8338EC',
  ropa: '#FF006E',
  tecnología: '#FFBE0B',
  otros: '#BDBDBD',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || '#BDBDBD';
}

import type { MealType } from './types'

export const MEALS: { id: MealType; label: string }[] = [
  { id: 'desayuno', label: 'Desayuno' },
  { id: 'comida', label: 'Comida' },
  { id: 'cena', label: 'Cena' },
  { id: 'snacks', label: 'Snacks' },
]

export const MEAL_LABEL: Record<MealType, string> = Object.fromEntries(MEALS.map((m) => [m.id, m.label])) as Record<MealType, string>

/** Sugiere la comida según la hora del día. */
export function mealForNow(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'desayuno'
  if (h < 17) return 'comida'
  if (h < 22) return 'cena'
  return 'snacks'
}

// Colores validados para contraste y daltonismo sobre la superficie oscura.
export const COLORS = {
  kcal: '#0ea371',
  kcal2: '#0b8fd0',
  protein: '#0b8fd0',
  carbs: '#c97f05',
  fat: '#ec4899',
}

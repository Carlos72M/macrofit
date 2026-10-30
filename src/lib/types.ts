// Modelo de datos de MacroFit.
// Todas las entidades persistidas llevan `id` y `updatedAt` para permitir
// sincronización en la nube (last-write-wins) en una versión futura.

export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'lose' | 'maintain' | 'gain'
export type MacroMode = 'protein_first' | 'percent'
export type MealType = 'desayuno' | 'comida' | 'cena' | 'snacks'
export type FoodSource = 'macrofit' | 'openfoodfacts' | 'custom'

export interface Syncable {
  id: string
  updatedAt: number
  deleted?: boolean
}

export interface Profile {
  name: string
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: ActivityLevel
  goal: Goal
  /** Ajuste calórico en % sobre el mantenimiento (negativo = déficit). */
  adjustmentPct: number
  macroMode: MacroMode
  /** Modo proteína primero: g de proteína por kg de peso. */
  proteinPerKg: number
  /** Modo proteína primero: % de calorías desde grasa; carbohidratos = resto. */
  fatPct: number
  /** Modo porcentajes. */
  percent: { protein: number; carbs: number; fat: number }
  updatedAt: number
}

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface Serving {
  label: string
  grams: number
}

export interface Food {
  id: string
  name: string
  brand?: string
  source: FoodSource
  /** Valores por 100 g (o 100 ml). */
  per100: Macros & { fiber?: number }
  servings: Serving[]
  category?: string
  barcode?: string
}

export interface CustomFood extends Food, Syncable {}

export interface LogEntry extends Syncable {
  date: string // YYYY-MM-DD
  meal: MealType
  food: Food // copia del alimento al momento de registrarlo
  grams: number
  quantity: number
  servingLabel: string // "g" o el nombre de la porción
  createdAt: number
}

export interface WeightEntry extends Syncable {
  date: string
  kg: number
}

export interface Targets extends Macros {
  bmr: number
  tdee: number
}

import type { ActivityLevel, Food, Goal, LogEntry, Macros, Profile, Targets } from './types'

export const ACTIVITY: Record<ActivityLevel, { label: string; detail: string; factor: number }> = {
  sedentary: { label: 'Sedentario', detail: 'Poco o nada de ejercicio', factor: 1.2 },
  light: { label: 'Ligero', detail: 'Ejercicio 1–3 días/semana', factor: 1.375 },
  moderate: { label: 'Moderado', detail: 'Ejercicio 3–5 días/semana', factor: 1.55 },
  active: { label: 'Activo', detail: 'Ejercicio intenso 6–7 días/semana', factor: 1.725 },
  very_active: { label: 'Muy activo', detail: 'Doble sesión o trabajo físico', factor: 1.9 },
}

export const GOALS: Record<Goal, { label: string; detail: string; defaultPct: number }> = {
  lose: { label: 'Perder grasa', detail: 'Déficit calórico', defaultPct: -20 },
  maintain: { label: 'Recomposición', detail: 'Mantenimiento', defaultPct: 0 },
  gain: { label: 'Ganar músculo', detail: 'Superávit ligero', defaultPct: 10 },
}

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 }

/** Metabolismo basal — Mifflin-St Jeor. */
export function mifflinStJeor(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age
  return p.sex === 'male' ? base + 5 : base - 161
}

export function calcTargets(p: Profile): Targets {
  const bmr = mifflinStJeor(p)
  const tdee = bmr * ACTIVITY[p.activity].factor
  // Límite de seguridad: nunca por debajo del basal ni de 1200 kcal.
  const kcal = Math.max(Math.round(tdee * (1 + p.adjustmentPct / 100)), Math.round(Math.min(bmr, 1200)))

  let protein: number, fat: number, carbs: number
  if (p.macroMode === 'protein_first') {
    protein = p.proteinPerKg * p.weightKg
    fat = (kcal * p.fatPct) / 100 / KCAL_PER_G.fat
    carbs = Math.max(0, (kcal - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat) / KCAL_PER_G.carbs)
  } else {
    protein = (kcal * p.percent.protein) / 100 / KCAL_PER_G.protein
    carbs = (kcal * p.percent.carbs) / 100 / KCAL_PER_G.carbs
    fat = (kcal * p.percent.fat) / 100 / KCAL_PER_G.fat
  }
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  }
}

export function macrosFor(food: Food, grams: number): Macros {
  const f = grams / 100
  return {
    kcal: food.per100.kcal * f,
    protein: food.per100.protein * f,
    carbs: food.per100.carbs * f,
    fat: food.per100.fat * f,
  }
}

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
    { ...ZERO },
  )
}

export function entryMacros(e: LogEntry): Macros {
  return macrosFor(e.food, e.grams)
}

export function totalsFor(entries: LogEntry[]): Macros {
  return sumMacros(entries.map(entryMacros))
}

export const round = (n: number, d = 0) => {
  const k = 10 ** d
  return Math.round(n * k) / k
}

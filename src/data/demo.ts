import type { AppData } from '../store'
import type { LogEntry, MealType, Profile, WeightEntry } from '../lib/types'
import { LOCAL_FOODS } from './foods'
import { addDays, today, uid } from '../lib/date'

const byName = (name: string) => {
  const f = LOCAL_FOODS.find((x) => x.name === name)
  if (!f) throw new Error(`Alimento demo no encontrado: ${name}`)
  return f
}

type Item = [string, number, string?] // nombre, gramos, porción
const MENUS: Record<MealType, Item[][]> = {
  desayuno: [
    [['Huevo entero', 100, '2 piezas'], ['Tortilla de maíz', 60], ['Frijoles refritos', 60], ['Café americano', 240, 'taza']],
    [['Avena en hojuelas', 40, '½ taza'], ['Leche deslactosada light', 250, 'vaso (250 ml)'], ['Plátano', 118, 'pieza mediana'], ['Proteína whey (polvo)', 30, 'scoop']],
    [['Yogur griego natural', 150, 'vaso'], ['Granola', 30, '¼ taza'], ['Fresas', 150, 'taza']],
  ],
  comida: [
    [['Pechuga de pollo cocida', 150, 'filete mediano'], ['Arroz rojo (a la mexicana)', 170, 'taza'], ['Brócoli cocido', 156, 'taza'], ['Aguacate', 68, '½ pieza']],
    [['Bistec de res cocido', 120, 'bistec'], ['Nopal cocido', 150, 'taza'], ['Tortilla de maíz', 90, '3 piezas'], ['Frijoles negros cocidos', 86, '½ taza']],
    [['Salmón cocido', 150, 'filete'], ['Papa cocida', 170, 'pieza mediana'], ['Espinaca cruda', 60]],
  ],
  cena: [
    [['Atún en agua (drenado)', 100, 'lata drenada'], ['Tostada horneada', 33], ['Aguacate', 30], ['Jitomate', 60]],
    [['Quesadilla de queso (tortilla maíz)', 200], ['Salsa verde', 32]],
    [['Huevos a la mexicana', 150, 'porción'], ['Tortilla de maíz', 60], ['Queso panela', 60, 'porción']],
  ],
  snacks: [
    [['Manzana', 182, 'pieza mediana'], ['Almendras', 28, 'puño (23 pzas)']],
    [['Proteína whey (polvo)', 30, 'scoop'], ['Leche descremada', 250, 'vaso (250 ml)']],
    [['Yogur griego natural', 150, 'vaso']],
  ],
}

export function buildDemoData(base: Profile): AppData {
  const t = today()
  const now = Date.now()
  const profile: Profile = { ...base, name: 'Demo', sex: 'male', age: 32, heightCm: 176, weightKg: 82.4, updatedAt: now }

  const entries: LogEntry[] = []
  for (let d = 13; d >= 0; d--) {
    const date = addDays(t, -d)
    ;(Object.keys(MENUS) as MealType[]).forEach((meal, mi) => {
      if (d === 0 && meal === 'cena') return // hoy: cena pendiente
      const menu = MENUS[meal][(d + mi) % MENUS[meal].length]
      for (const [name, grams, label] of menu) {
        const food = byName(name)
        const serving = label ? food.servings.find((s) => s.label === label) : undefined
        entries.push({
          id: uid(), date, meal, food, grams,
          quantity: serving ? grams / serving.grams : grams,
          servingLabel: serving ? serving.label : 'g',
          createdAt: now, updatedAt: now,
        })
      }
    })
  }

  const weights: WeightEntry[] = []
  for (let d = 60; d >= 0; d -= 1) {
    if (d % 2 === 1 && d > 7) continue
    const trend = 86.2 - (60 - d) * 0.063
    const noise = Math.sin(d * 1.7) * 0.35 + Math.cos(d * 0.9) * 0.2
    weights.push({ id: uid(), date: addDays(t, -d), kg: Math.round((trend + noise) * 10) / 10, updatedAt: now })
  }
  profile.weightKg = weights[weights.length - 1].kg

  return { profile, isDemo: true, entries, weights, customFoods: [], recents: [] }
}

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CustomFood, Food, LogEntry, MealType, Profile, WeightEntry } from '../lib/types'
import { uid } from '../lib/date'
import { localStorageAdapter } from './storage'
import { buildDemoData } from '../data/demo'

export const DEFAULT_PROFILE: Profile = {
  name: '',
  sex: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 80,
  activity: 'moderate',
  goal: 'lose',
  adjustmentPct: -20,
  macroMode: 'protein_first',
  proteinPerKg: 2,
  fatPct: 25,
  percent: { protein: 35, carbs: 40, fat: 25 },
  updatedAt: 0,
}

export interface AppData {
  profile: Profile | null
  isDemo: boolean
  entries: LogEntry[]
  weights: WeightEntry[]
  customFoods: CustomFood[]
  recents: Food[]
}

interface Actions {
  saveProfile: (p: Omit<Profile, 'updatedAt'>) => void
  addEntry: (e: Omit<LogEntry, 'id' | 'updatedAt' | 'createdAt'>) => void
  updateEntry: (id: string, patch: Partial<Pick<LogEntry, 'grams' | 'quantity' | 'servingLabel' | 'meal'>>) => void
  removeEntry: (id: string) => void
  copyMeal: (fromDate: string, toDate: string, meal: MealType) => number
  logWeight: (date: string, kg: number) => void
  removeWeight: (id: string) => void
  saveCustomFood: (f: Omit<Food, 'id' | 'source'> & { id?: string }) => CustomFood
  removeCustomFood: (id: string) => void
  loadDemo: () => void
  importData: (d: AppData) => void
  resetAll: () => void
}

const EMPTY: AppData = { profile: null, isDemo: false, entries: [], weights: [], customFoods: [], recents: [] }

export const useStore = create<AppData & Actions>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      saveProfile: (p) => set({ profile: { ...p, updatedAt: Date.now() } }),

      addEntry: (e) => {
        const now = Date.now()
        const entry: LogEntry = { ...e, id: uid(), createdAt: now, updatedAt: now }
        set((s) => ({
          entries: [...s.entries, entry],
          recents: [e.food, ...s.recents.filter((r) => r.id !== e.food.id)].slice(0, 25),
        }))
      },

      updateEntry: (id, patch) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e)) })),

      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, deleted: true, updatedAt: Date.now() } : e)) })),

      copyMeal: (fromDate, toDate, meal) => {
        const src = get().entries.filter((e) => !e.deleted && e.date === fromDate && e.meal === meal)
        const now = Date.now()
        set((s) => ({
          entries: [...s.entries, ...src.map((e) => ({ ...e, id: uid(), date: toDate, createdAt: now, updatedAt: now }))],
        }))
        return src.length
      },

      logWeight: (date, kg) => {
        const now = Date.now()
        set((s) => {
          const existing = s.weights.find((w) => w.date === date && !w.deleted)
          const weights = existing
            ? s.weights.map((w) => (w.id === existing.id ? { ...w, kg, updatedAt: now } : w))
            : [...s.weights, { id: uid(), date, kg, updatedAt: now }]
          // El peso más reciente actualiza el perfil (y por tanto los objetivos).
          const latest = weights.filter((w) => !w.deleted).sort((a, b) => b.date.localeCompare(a.date))[0]
          const profile = s.profile && latest ? { ...s.profile, weightKg: latest.kg, updatedAt: now } : s.profile
          return { weights, profile }
        })
      },

      removeWeight: (id) =>
        set((s) => ({ weights: s.weights.map((w) => (w.id === id ? { ...w, deleted: true, updatedAt: Date.now() } : w)) })),

      saveCustomFood: (f) => {
        const food: CustomFood = { ...f, id: f.id ?? `custom-${uid()}`, source: 'custom', updatedAt: Date.now() }
        set((s) => ({ customFoods: [food, ...s.customFoods.filter((c) => c.id !== food.id)] }))
        return food
      },

      removeCustomFood: (id) =>
        set((s) => ({
          customFoods: s.customFoods.map((c) => (c.id === id ? { ...c, deleted: true, updatedAt: Date.now() } : c)),
          recents: s.recents.filter((r) => r.id !== id),
        })),

      loadDemo: () => set({ ...buildDemoData(DEFAULT_PROFILE), isDemo: true }),

      importData: (d) => set({ ...EMPTY, ...d }),

      resetAll: () => set({ ...EMPTY }),
    }),
    {
      name: 'macrofit:data',
      version: 1,
      storage: createJSONStorage(() => localStorageAdapter),
      partialize: ({ profile, isDemo, entries, weights, customFoods, recents }) =>
        ({ profile, isDemo, entries, weights, customFoods, recents }),
    },
  ),
)

// Helpers de lectura (excluyen registros con borrado lógico). Usar dentro de
// useMemo: devuelven arreglos nuevos y no deben pasarse como selector a useStore.
export const activeWeights = (ws: WeightEntry[]) =>
  ws.filter((w) => !w.deleted).sort((a, b) => a.date.localeCompare(b.date))
export const activeCustomFoods = (cs: CustomFood[]) => cs.filter((c) => !c.deleted)
export const entriesFor = (es: LogEntry[], date: string) => es.filter((e) => !e.deleted && e.date === date)

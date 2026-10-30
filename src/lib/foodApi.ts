import type { Food, Serving } from './types'
import { LOCAL_FOODS } from '../data/foods'

// Búsqueda en Open Food Facts (base abierta y colaborativa, con muchos productos
// mexicanos). No requiere API key y admite CORS desde el navegador.
const OFF_SEARCH = 'https://mx.openfoodfacts.org/cgi/search.pl'
const OFF_PRODUCT = 'https://world.openfoodfacts.org/api/v2/product'
const FIELDS = 'code,product_name,product_name_es,generic_name_es,brands,nutriments,serving_size,serving_quantity'

interface OffProduct {
  code?: string
  product_name?: string
  product_name_es?: string
  generic_name_es?: string
  brands?: string
  serving_size?: string
  serving_quantity?: number | string
  nutriments?: Record<string, number | string | undefined>
}

const num = (v: unknown) => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : undefined
}

function mapOff(p: OffProduct): Food | null {
  const n = p.nutriments ?? {}
  const name = (p.product_name_es || p.product_name || p.generic_name_es || '').trim()
  let kcal = num(n['energy-kcal_100g'])
  if (kcal === undefined) {
    const kj = num(n['energy_100g'])
    if (kj !== undefined) kcal = kj / 4.184
  }
  const protein = num(n['proteins_100g'])
  const carbs = num(n['carbohydrates_100g'])
  const fat = num(n['fat_100g'])
  if (!name || kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) return null

  const servings: Serving[] = []
  const sq = num(p.serving_quantity)
  if (sq && sq > 0) servings.push({ label: p.serving_size ? `porción (${p.serving_size})` : 'porción', grams: sq })

  return {
    id: `off-${p.code ?? name}`,
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    source: 'openfoodfacts',
    barcode: p.code,
    per100: { kcal: Math.round(kcal), protein, carbs, fat, fiber: num(n['fiber_100g']) },
    servings,
  }
}

export async function searchOpenFoodFacts(query: string, signal?: AbortSignal): Promise<Food[]> {
  const q = query.trim()
  if (/^\d{8,14}$/.test(q)) {
    const f = await lookupBarcode(q, signal)
    return f ? [f] : []
  }
  const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=30&fields=${FIELDS}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open Food Facts respondió ${res.status}`)
  const data = (await res.json()) as { products?: OffProduct[] }
  const seen = new Set<string>()
  return (data.products ?? [])
    .map(mapOff)
    .filter((f): f is Food => !!f && !seen.has(f.id) && !!seen.add(f.id))
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<Food | null> {
  const res = await fetch(`${OFF_PRODUCT}/${code}.json?fields=${FIELDS}`, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as { status?: number; product?: OffProduct }
  return data.status === 1 && data.product ? mapOff({ code, ...data.product }) : null
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Búsqueda local (alimentos MacroFit + personalizados), tolerante a acentos. */
export function searchLocal(query: string, extra: Food[] = []): Food[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  const all = [...extra, ...LOCAL_FOODS]
  if (!terms.length) return all
  return all
    .map((f) => {
      const hay = normalize(`${f.name} ${f.brand ?? ''} ${f.category ?? ''}`)
      if (!terms.every((t) => hay.includes(t))) return null
      const score = normalize(f.name).startsWith(terms[0]) ? 0 : 1
      return { f, score }
    })
    .filter((x): x is { f: Food; score: number } => !!x)
    .sort((a, b) => a.score - b.score)
    .map((x) => x.f)
}

export const SOURCE_LABEL: Record<Food['source'], string> = {
  macrofit: 'MacroFit · ref. USDA/SMAE',
  openfoodfacts: 'Open Food Facts',
  custom: 'Personalizado',
}

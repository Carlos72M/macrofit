import { useEffect, useMemo, useState } from 'react'
import { activeCustomFoods, useStore } from '../store'
import type { AddTarget } from '../App'
import type { Food, LogEntry, MealType, RecipeIngredient } from '../lib/types'
import { macrosFor, round, sumMacros } from '../lib/calc'
import { searchLocal, searchOpenFoodFacts, SOURCE_LABEL } from '../lib/foodApi'
import { CATEGORIES } from '../data/foods'
import { MEALS, MEAL_LABEL, COLORS } from '../lib/meals'
import { relativeLabel } from '../lib/date'
import { Sheet } from '../components/Sheet'
import { Button, Label, NumberField, Segmented } from '../components/ui'
import { IconChevronL, IconEdit, IconGlobe, IconPlate, IconPlus, IconSearch, IconTrash } from '../components/Icons'

type Step =
  | { kind: 'search' }
  | { kind: 'detail'; food: Food }
  | { kind: 'custom'; initial?: Food }
  | { kind: 'recipe' }
  | { kind: 'ingSearch' }
  | { kind: 'ingDetail'; food: Food; index?: number }

interface RecipeDraft {
  id?: string
  name: string
  portions: number
  portionLabel: string
  ingredients: RecipeIngredient[]
}

const newDraft = (): RecipeDraft => ({ name: '', portions: 1, portionLabel: 'porción', ingredients: [] })

const draftFrom = (f: Food): RecipeDraft => ({
  id: f.id,
  name: f.name,
  portions: f.recipe?.portions ?? 1,
  portionLabel: f.servings[0]?.label ?? 'porción',
  ingredients: f.recipe?.ingredients ?? [],
})

export function AddFoodFlow({ target, editing, onClose }: { target: AddTarget | null; editing: LogEntry | null; onClose: () => void }) {
  const open = !!target || !!editing
  const [step, setStep] = useState<Step>({ kind: 'search' })
  const [meal, setMeal] = useState<MealType>('comida')
  const [draft, setDraft] = useState<RecipeDraft>(newDraft)

  useEffect(() => {
    if (editing) { setStep({ kind: 'detail', food: editing.food }); setMeal(editing.meal) }
    else if (target) { setStep({ kind: 'search' }); setMeal(target.meal) }
  }, [target, editing])

  const date = editing?.date ?? target?.date ?? ''
  const titles: Record<Step['kind'], string> = {
    search: `Agregar a ${MEAL_LABEL[meal]}`,
    custom: 'Alimento personalizado',
    detail: editing ? 'Editar registro' : 'Cantidad',
    recipe: draft.id ? 'Editar platillo' : 'Crear platillo',
    ingSearch: 'Agregar ingrediente',
    ingDetail: 'Ingrediente',
  }

  const editFood = (f: Food) => {
    if (f.recipe) { setDraft(draftFrom(f)); setStep({ kind: 'recipe' }) }
    else setStep({ kind: 'custom', initial: f })
  }

  return (
    <Sheet open={open} onClose={onClose} title={titles[step.kind]} full>
      {step.kind === 'search' && (
        <FoodSearch meal={meal} setMeal={setMeal} date={date}
          onPick={(food) => setStep({ kind: 'detail', food })}
          onCustom={() => setStep({ kind: 'custom' })}
          onRecipe={() => { setDraft(newDraft()); setStep({ kind: 'recipe' }) }} />
      )}
      {step.kind === 'detail' && (
        <FoodDetail key={step.food.id} food={step.food} meal={meal} setMeal={setMeal} date={date} editing={editing}
          onBack={editing ? undefined : () => setStep({ kind: 'search' })}
          onEditFood={step.food.source === 'custom' && !editing ? () => editFood(step.food) : undefined}
          onDone={onClose} />
      )}
      {step.kind === 'custom' && (
        <CustomFoodForm initial={step.initial} onBack={() => setStep(step.initial ? { kind: 'detail', food: step.initial } : { kind: 'search' })}
          onSaved={(food) => setStep({ kind: 'detail', food })} onDeleted={() => setStep({ kind: 'search' })} />
      )}
      {step.kind === 'recipe' && (
        <RecipeBuilder draft={draft} setDraft={setDraft}
          onBack={() => setStep({ kind: 'search' })}
          onAddIngredient={() => setStep({ kind: 'ingSearch' })}
          onEditIngredient={(i) => setStep({ kind: 'ingDetail', food: draft.ingredients[i].food, index: i })}
          onSaved={(food) => setStep({ kind: 'detail', food })}
          onDeleted={() => setStep({ kind: 'search' })} />
      )}
      {step.kind === 'ingSearch' && (
        <FoodSearch mode="ingredient" excludeId={draft.id} meal={meal} setMeal={setMeal} date={date}
          onPick={(food) => setStep({ kind: 'ingDetail', food })}
          onBack={() => setStep({ kind: 'recipe' })} />
      )}
      {step.kind === 'ingDetail' && (() => {
        const idx = step.index
        const current = idx !== undefined ? draft.ingredients[idx] : undefined
        return (
          <FoodDetail key={`ing-${step.food.id}-${idx ?? 'new'}`} food={step.food} meal={meal} setMeal={setMeal} date={date} editing={null}
            onBack={() => setStep(idx !== undefined ? { kind: 'recipe' } : { kind: 'ingSearch' })}
            onDone={() => setStep({ kind: 'recipe' })}
            ingredient={{
              initial: current,
              onSubmit: (ing) => setDraft((d) => {
                // Guardamos una copia sin receta anidada para que el platillo no crezca sin límite.
                const { recipe: _r, ...food } = step.food
                const item = { ...ing, food }
                const ingredients = idx !== undefined ? d.ingredients.map((x, i) => (i === idx ? item : x)) : [...d.ingredients, item]
                return { ...d, ingredients }
              }),
              onRemove: idx !== undefined ? () => setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((_, i) => i !== idx) })) : undefined,
            }} />
        )
      })()}
    </Sheet>
  )
}

/* ---------------- Búsqueda ---------------- */

type Scope = 'todos' | 'recientes' | 'mios'

function FoodSearch({ meal, setMeal, date, onPick, onCustom, onRecipe, onBack, mode = 'log', excludeId }: {
  meal: MealType; setMeal: (m: MealType) => void; date: string; onPick: (f: Food) => void
  onCustom?: () => void; onRecipe?: () => void; onBack?: () => void; mode?: 'log' | 'ingredient'; excludeId?: string
}) {
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<Scope>('todos')
  const [cat, setCat] = useState<string | null>(null)
  const recents = useStore((s) => s.recents)
  const customAll = useStore((s) => s.customFoods)
  const custom = useMemo(() => activeCustomFoods(customAll), [customAll])
  const [online, setOnline] = useState<{ loading: boolean; error?: string; items: Food[] }>({ loading: false, items: [] })

  const local = useMemo(() => {
    if (scope === 'recientes') return q ? searchLocal(q, recents).filter((f) => recents.some((r) => r.id === f.id)) : recents
    if (scope === 'mios') return q ? searchLocal(q, custom).filter((f) => f.source === 'custom') : custom
    const res = searchLocal(q, custom)
    return cat && !q ? res.filter((f) => f.category === cat) : res
  }, [q, scope, cat, recents, custom])

  // Consulta a Open Food Facts con debounce
  useEffect(() => {
    const term = q.trim()
    if (scope !== 'todos' || term.length < 3) { setOnline({ loading: false, items: [] }); return }
    const ctrl = new AbortController()
    setOnline((o) => ({ ...o, loading: true, error: undefined }))
    const id = setTimeout(() => {
      searchOpenFoodFacts(term, ctrl.signal)
        .then((items) => setOnline({ loading: false, items }))
        .catch(() => {
          if (ctrl.signal.aborted) return
          setOnline({ loading: false, items: [], error: navigator.onLine ? 'No se pudo consultar Open Food Facts en este momento' : 'Sin conexión a internet' })
        })
    }, 450)
    return () => { clearTimeout(id); ctrl.abort() }
  }, [q, scope])

  const shown = local.filter((f) => f.id !== excludeId).slice(0, q ? 40 : 60)

  return (
    <div className="space-y-3">
      {mode === 'log' ? (
        <>
          <div className="text-xs text-muted">{relativeLabel(date)}</div>
          <Segmented value={meal} onChange={setMeal} options={MEALS.map((m) => ({ value: m.id, label: m.label }))} />
        </>
      ) : (
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted"><IconChevronL width={18} height={18} /> Volver al platillo</button>
      )}

      <div className="sticky top-0 z-10 -mx-5 bg-surface px-5 pb-2 pt-1">
        <div className="relative">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width={19} height={19} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar alimento, marca o código de barras"
            className="field pl-11" enterKeyHint="search" />
        </div>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {([['todos', 'Todos'], ['recientes', 'Recientes'], ['mios', 'Mis alimentos']] as [Scope, string][]).map(([v, l]) => (
            <Chip key={v} active={scope === v} onClick={() => setScope(v)}>{l}</Chip>
          ))}
          {scope === 'todos' && !q && <span className="mx-1 w-px shrink-0 bg-line" />}
          {scope === 'todos' && !q && CATEGORIES.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</Chip>
          ))}
        </div>
      </div>

      {mode === 'log' && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onRecipe} className="flex items-center gap-2.5 rounded-2xl border border-dashed border-line px-3 py-3 text-left text-sm text-soft active:bg-card-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-2/15 text-brand-2"><IconPlate width={18} height={18} /></span>
            <span className="leading-tight">Crear platillo<span className="block text-[11px] text-muted">con ingredientes</span></span>
          </button>
          <button onClick={onCustom} className="flex items-center gap-2.5 rounded-2xl border border-dashed border-line px-3 py-3 text-left text-sm text-soft active:bg-card-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand"><IconPlus width={18} height={18} /></span>
            <span className="leading-tight">Crear alimento<span className="block text-[11px] text-muted">con su etiqueta</span></span>
          </button>
        </div>
      )}

      {shown.length > 0 && (
        <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line bg-card">
          {shown.map((f) => <FoodRow key={f.id} food={f} onClick={() => onPick(f)} />)}
        </ul>
      )}
      {shown.length === 0 && scope === 'todos' && q.trim() && (
        <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted">
          No está en la base local. Prueba con otro nombre o registra sus ingredientes por separado (ej. “pan”, “salchicha”).
        </p>
      )}
      {shown.length === 0 && scope !== 'todos' && (
        <p className="py-8 text-center text-sm text-muted">
          {scope === 'recientes' ? 'Aún no tienes alimentos recientes.' : 'Aún no has creado alimentos ni platillos.'}
        </p>
      )}

      {scope === 'todos' && q.trim().length >= 3 && (
        <section>
          <div className="mb-2 mt-4 flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted">
            <IconGlobe width={15} height={15} /> Open Food Facts · México
            {online.loading && <span className="ml-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />}
          </div>
          {online.error && <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted">{online.error}. Puedes usar la base local o registrar el alimento manualmente.</p>}
          {!online.loading && !online.error && online.items.length === 0 && (
            <p className="px-1 text-sm text-muted">Sin resultados en línea para “{q}”.</p>
          )}
          {online.items.length > 0 && (
            <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line bg-card">
              {online.items.map((f) => <FoodRow key={f.id} food={f} onClick={() => onPick(f)} />)}
            </ul>
          )}
        </section>
      )}
      {scope === 'todos' && q.trim().length > 0 && q.trim().length < 3 && (
        <p className="px-1 text-xs text-muted">Escribe al menos 3 letras para buscar también en Open Food Facts.</p>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition ${active ? 'border-brand bg-brand/15 text-brand' : 'border-line bg-card-2 text-soft'}`}>
      {children}
    </button>
  )
}

function SourceBadge({ food }: { food: Food }) {
  const cls = { macrofit: 'bg-brand/10 text-brand', openfoodfacts: 'bg-brand-2/10 text-brand-2', custom: 'bg-fat/10 text-fat' }[food.source]
  return <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>{food.recipe ? 'Mi platillo' : SOURCE_LABEL[food.source]}</span>
}

function FoodRow({ food, onClick }: { food: Food; onClick: () => void }) {
  const s = food.servings[0]
  const m = s ? macrosFor(food, s.grams) : food.per100
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px]">{food.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
            {food.brand && <span className="truncate">{food.brand} ·</span>}
            <span className="nums truncate">{s ? `${s.label} (${s.grams} g)` : '100 g'}</span>
          </div>
          <div className="mt-1"><SourceBadge food={food} /></div>
        </div>
        <div className="nums text-right">
          <div className="font-semibold">{Math.round(m.kcal)}</div>
          <div className="text-[11px] text-muted">kcal</div>
        </div>
      </button>
    </li>
  )
}

/* ---------------- Detalle / cantidad ---------------- */

type Portion = Pick<RecipeIngredient, 'grams' | 'quantity' | 'servingLabel'>

function FoodDetail({ food, meal, setMeal, date, editing, onBack, onEditFood, onDone, ingredient }: {
  food: Food; meal: MealType; setMeal: (m: MealType) => void; date: string; editing: LogEntry | null
  onBack?: () => void; onEditFood?: () => void; onDone: () => void
  /** Modo ingrediente: la cantidad se devuelve al platillo en vez de registrarse. */
  ingredient?: { initial?: Portion; onSubmit: (p: Portion) => void; onRemove?: () => void }
}) {
  const addEntry = useStore((s) => s.addEntry)
  const updateEntry = useStore((s) => s.updateEntry)
  const removeEntry = useStore((s) => s.removeEntry)
  const units = [{ label: 'g', grams: 1 }, ...food.servings]
  const prev: Portion | undefined = editing ?? ingredient?.initial
  const initialUnit = prev ? prev.servingLabel : food.servings[0]?.label ?? 'g'
  const [unit, setUnit] = useState(units.some((u) => u.label === initialUnit) ? initialUnit : 'g')
  const [qty, setQty] = useState<number>(prev ? round(prev.quantity, 2) : unit === 'g' ? 100 : 1)

  const u = units.find((x) => x.label === unit) ?? units[0]
  const grams = (Number.isFinite(qty) ? qty : 0) * u.grams
  const m = macrosFor(food, grams)
  const valid = grams > 0

  const chooseUnit = (label: string) => {
    const nu = units.find((x) => x.label === label)!
    // Conserva los gramos equivalentes al cambiar de unidad.
    const g = grams || (nu.label === 'g' ? 100 : nu.grams)
    setUnit(label)
    setQty(nu.label === 'g' ? round(g) : round(g / nu.grams, 2) || 1)
  }

  const save = () => {
    if (!valid) return
    if (ingredient) ingredient.onSubmit({ grams, quantity: qty, servingLabel: unit })
    else if (editing) updateEntry(editing.id, { grams, quantity: qty, servingLabel: unit, meal })
    else addEntry({ date, meal, food, grams, quantity: qty, servingLabel: unit })
    onDone()
  }

  const kcalSplit = m.protein * 4 + m.carbs * 4 + m.fat * 9 || 1

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        {onBack && (
          <button onClick={onBack} aria-label="Volver" className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card-2 text-soft"><IconChevronL /></button>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold leading-snug">{food.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            {food.brand && <span>{food.brand}</span>}
            <SourceBadge food={food} />
            {food.barcode && <span className="nums text-xs">#{food.barcode}</span>}
          </div>
        </div>
        {onEditFood && (
          <button onClick={onEditFood} aria-label="Editar alimento" className="grid h-9 w-9 place-items-center rounded-full bg-card-2 text-soft"><IconEdit width={18} height={18} /></button>
        )}
      </div>

      {/* Resultado */}
      <div className="glow rounded-3xl border border-line p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="nums font-display text-4xl font-bold">{Math.round(m.kcal)}</div>
            <div className="text-xs text-muted">kcal · {round(grams)} g</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {([['Proteína', m.protein, COLORS.protein], ['Carbs', m.carbs, COLORS.carbs], ['Grasa', m.fat, COLORS.fat]] as const).map(([l, v, c]) => (
              <div key={l}>
                <div className="nums text-lg font-semibold">{round(v, 1)}<span className="text-xs text-muted">g</span></div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex h-2 gap-[2px] overflow-hidden rounded-full">
          <div style={{ width: `${(m.protein * 4 / kcalSplit) * 100}%`, background: COLORS.protein }} />
          <div style={{ width: `${(m.carbs * 4 / kcalSplit) * 100}%`, background: COLORS.carbs }} />
          <div style={{ width: `${(m.fat * 9 / kcalSplit) * 100}%`, background: COLORS.fat }} />
        </div>
      </div>

      <div>
        <Label>Medida</Label>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {units.map((x) => (
            <Chip key={x.label} active={unit === x.label} onClick={() => chooseUnit(x.label)}>
              {x.label === 'g' ? 'gramos' : `${x.label} · ${x.grams} g`}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label hint={unit !== 'g' ? `= ${round(grams)} g` : undefined}>Cantidad</Label>
        <div className="flex items-center gap-2">
          <StepBtn onClick={() => setQty((q) => Math.max(0, round((q || 0) - (unit === 'g' ? 10 : 0.5), 2)))}>−</StepBtn>
          <NumberField value={qty} onChange={setQty} suffix={unit === 'g' ? 'g' : '×'} step={unit === 'g' ? 1 : 0.25} min={0} />
          <StepBtn onClick={() => setQty((q) => round((q || 0) + (unit === 'g' ? 10 : 0.5), 2))}>+</StepBtn>
        </div>
        {unit !== 'g' && (
          <div className="mt-2 flex gap-2">
            {[0.5, 1, 1.5, 2].map((v) => <Chip key={v} active={qty === v} onClick={() => setQty(v)}>{v === 0.5 ? '½' : v === 1.5 ? '1½' : v}</Chip>)}
          </div>
        )}
      </div>

      {!ingredient && (
        <div>
          <Label>Comida</Label>
          <Segmented value={meal} onChange={setMeal} options={MEALS.map((x) => ({ value: x.id, label: x.label }))} />
        </div>
      )}

      <div className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Por 100 g</div>
        <div className="nums grid grid-cols-5 gap-2 text-center text-xs">
          {([['kcal', food.per100.kcal], ['Prot.', food.per100.protein], ['Carbs', food.per100.carbs], ['Grasa', food.per100.fat], ['Fibra', food.per100.fiber]] as const).map(([l, v]) => (
            <div key={l}><div className="text-sm font-semibold text-ink">{v === undefined ? '—' : round(v, 1)}</div><div className="text-muted">{l}</div></div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">Fuente: {SOURCE_LABEL[food.source]}{food.source === 'openfoodfacts' ? ' (datos colaborativos, verifica con la etiqueta)' : ''}</p>
      </div>

      <div className="flex gap-2 pb-2">
        {(editing || ingredient?.onRemove) && (
          <Button variant="danger" className="!px-4" aria-label="Eliminar"
            onClick={() => { if (ingredient?.onRemove) ingredient.onRemove(); else if (editing) removeEntry(editing.id); onDone() }}>
            <IconTrash width={20} height={20} />
          </Button>
        )}
        <Button className="flex-1" disabled={!valid} onClick={save}>
          {ingredient ? (ingredient.initial ? 'Guardar ingrediente' : 'Agregar al platillo') : editing ? 'Guardar cambios' : `Agregar a ${MEAL_LABEL[meal]}`}
        </Button>
      </div>
    </div>
  )
}

function StepBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-2xl border border-line bg-card-2 text-xl text-soft active:scale-95">{children}</button>
}

/* ---------------- Alimento personalizado ---------------- */

function CustomFoodForm({ initial, onBack, onSaved, onDeleted }: { initial?: Food; onBack: () => void; onSaved: (f: Food) => void; onDeleted: () => void }) {
  const saveCustomFood = useStore((s) => s.saveCustomFood)
  const removeCustomFood = useStore((s) => s.removeCustomFood)
  const [name, setName] = useState(initial?.name ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [basis, setBasis] = useState<'100' | 'porcion'>(initial?.servings[0] ? 'porcion' : '100')
  const [portionLabel, setPortionLabel] = useState(initial?.servings[0]?.label ?? 'porción')
  const [portionG, setPortionG] = useState<number>(initial?.servings[0]?.grams ?? 100)
  const f0 = initial && basis === 'porcion' && initial.servings[0] ? initial.servings[0].grams / 100 : 1
  const [kcal, setKcal] = useState<number>(initial ? round(initial.per100.kcal * f0) : NaN)
  const [p, setP] = useState<number>(initial ? round(initial.per100.protein * f0, 1) : NaN)
  const [c, setC] = useState<number>(initial ? round(initial.per100.carbs * f0, 1) : NaN)
  const [f, setF] = useState<number>(initial ? round(initial.per100.fat * f0, 1) : NaN)
  const [fiber, setFiber] = useState<number>(initial?.per100.fiber !== undefined ? round(initial.per100.fiber * f0, 1) : NaN)

  const z = (n: number) => (Number.isFinite(n) ? n : 0)
  const fromMacros = round(z(p) * 4 + z(c) * 4 + z(f) * 9)
  const base = basis === '100' ? 100 : portionG
  const valid = name.trim() && base > 0 && (Number.isFinite(kcal) || fromMacros > 0)

  const save = () => {
    if (!valid) return
    const k = 100 / base
    const food = saveCustomFood({
      id: initial?.id,
      name: name.trim(),
      brand: brand.trim() || undefined,
      per100: {
        kcal: round((Number.isFinite(kcal) ? kcal : fromMacros) * k, 1),
        protein: round(z(p) * k, 2), carbs: round(z(c) * k, 2), fat: round(z(f) * k, 2),
        fiber: Number.isFinite(fiber) ? round(fiber * k, 2) : undefined,
      },
      servings: basis === 'porcion' ? [{ label: portionLabel.trim() || 'porción', grams: portionG }] : [],
    })
    onSaved(food)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted"><IconChevronL width={18} height={18} /> Volver</button>
      <div><Label>Nombre</Label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Licuado de proteína casero" /></div>
      <div><Label>Marca (opcional)</Label><input className="field" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej. Lala" /></div>

      <div>
        <Label>Valores nutricionales</Label>
        <Segmented value={basis} onChange={setBasis} options={[{ value: '100', label: 'Por 100 g' }, { value: 'porcion', label: 'Por porción' }]} />
      </div>
      {basis === 'porcion' && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Nombre de la porción</Label><input className="field" value={portionLabel} onChange={(e) => setPortionLabel(e.target.value)} /></div>
          <div><Label>Peso</Label><NumberField value={portionG} onChange={setPortionG} suffix="g" /></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div><Label hint={fromMacros ? `≈ ${fromMacros}` : undefined}>Calorías</Label><NumberField value={kcal} onChange={setKcal} suffix="kcal" /></div>
        <div><Label>Proteína</Label><NumberField value={p} onChange={setP} suffix="g" step={0.1} /></div>
        <div><Label>Carbohidratos</Label><NumberField value={c} onChange={setC} suffix="g" step={0.1} /></div>
        <div><Label>Grasa</Label><NumberField value={f} onChange={setF} suffix="g" step={0.1} /></div>
        <div><Label>Fibra (opcional)</Label><NumberField value={fiber} onChange={setFiber} suffix="g" step={0.1} /></div>
      </div>
      <p className="text-xs text-muted">Si dejas las calorías vacías se calculan con los macros (4/4/9 kcal por gramo).</p>
      <div className="rounded-2xl border border-line bg-card px-4 py-3 text-xs leading-relaxed text-soft">
        <b className="text-ink">¿No conoces los valores?</b> Copia los de la tabla nutrimental del empaque. Si es un platillo,
        vuelve atrás y registra sus ingredientes por separado (por ejemplo: pan, salchicha y catsup).
      </div>

      <div className="flex gap-2 pb-2">
        {initial && (
          <Button variant="danger" className="!px-4" aria-label="Eliminar alimento" onClick={() => { removeCustomFood(initial.id); onDeleted() }}>
            <IconTrash width={20} height={20} />
          </Button>
        )}
        <Button className="flex-1" disabled={!valid} onClick={save}>Guardar alimento</Button>
      </div>
    </div>
  )
}

/* ---------------- Platillo con ingredientes ---------------- */

function RecipeBuilder({ draft, setDraft, onBack, onAddIngredient, onEditIngredient, onSaved, onDeleted }: {
  draft: RecipeDraft; setDraft: (f: (d: RecipeDraft) => RecipeDraft) => void
  onBack: () => void; onAddIngredient: () => void; onEditIngredient: (i: number) => void
  onSaved: (f: Food) => void; onDeleted: () => void
}) {
  const saveCustomFood = useStore((s) => s.saveCustomFood)
  const removeCustomFood = useStore((s) => s.removeCustomFood)
  const set = <K extends keyof RecipeDraft>(k: K, v: RecipeDraft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const total = sumMacros(draft.ingredients.map((i) => macrosFor(i.food, i.grams)))
  const totalGrams = draft.ingredients.reduce((a, i) => a + i.grams, 0)
  const portions = Number.isFinite(draft.portions) && draft.portions > 0 ? draft.portions : 1
  const per = { kcal: total.kcal / portions, protein: total.protein / portions, carbs: total.carbs / portions, fat: total.fat / portions }
  const valid = draft.name.trim() && draft.ingredients.length > 0 && totalGrams > 0

  const save = () => {
    if (!valid) return
    const k = 100 / totalGrams
    const fiber = draft.ingredients.reduce((a, i) => a + ((i.food.per100.fiber ?? 0) * i.grams) / 100, 0)
    const label = draft.portionLabel.trim() || 'porción'
    const food = saveCustomFood({
      id: draft.id,
      name: draft.name.trim(),
      per100: {
        kcal: round(total.kcal * k, 1), protein: round(total.protein * k, 2), carbs: round(total.carbs * k, 2),
        fat: round(total.fat * k, 2), fiber: round(fiber * k, 2),
      },
      servings: [
        { label, grams: round(totalGrams / portions, 1) },
        ...(portions > 1 ? [{ label: 'platillo completo', grams: round(totalGrams, 1) }] : []),
      ],
      recipe: { ingredients: draft.ingredients, portions },
    })
    onSaved(food)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted"><IconChevronL width={18} height={18} /> Volver</button>

      <div>
        <Label>Nombre del platillo</Label>
        <input className="field" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej. Hot dog casero" />
      </div>

      <div>
        <Label hint={draft.ingredients.length ? `${round(totalGrams)} g en total` : undefined}>Ingredientes</Label>
        {draft.ingredients.length > 0 && (
          <ul className="mb-2 divide-y divide-line/60 overflow-hidden rounded-2xl border border-line bg-card">
            {draft.ingredients.map((i, idx) => {
              const m = macrosFor(i.food, i.grams)
              return (
                <li key={idx}>
                  <button onClick={() => onEditIngredient(idx)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px]">{i.food.name}</div>
                      <div className="nums truncate text-xs text-muted">
                        {i.servingLabel === 'g' ? `${round(i.grams)} g` : `${round(i.quantity, 2)} × ${i.servingLabel} (${round(i.grams)} g)`}
                      </div>
                    </div>
                    <div className="nums text-right text-sm">
                      <div className="font-semibold">{Math.round(m.kcal)}</div>
                      <div className="text-[11px] text-muted">{round(m.protein, 1)} g P</div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <button onClick={onAddIngredient}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/50 px-4 py-3 text-sm text-brand active:bg-brand/10">
          <IconPlus width={18} height={18} /> Agregar ingrediente
        </button>
        {draft.ingredients.length === 0 && (
          <p className="mt-2 px-1 text-xs text-muted">Busca cada ingrediente como si lo registraras (ej. pan para hot dog, salchicha, catsup) y elige la cantidad que lleva.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>¿Cuántas porciones rinde?</Label><NumberField value={draft.portions} onChange={(v) => set('portions', v)} min={1} step={1} /></div>
        <div><Label>Nombre de la porción</Label><input className="field" value={draft.portionLabel} onChange={(e) => set('portionLabel', e.target.value)} /></div>
      </div>

      {draft.ingredients.length > 0 && (
        <div className="glow rounded-3xl border border-line p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
            {portions > 1 ? `Por ${draft.portionLabel || 'porción'} (1 de ${portions})` : 'Platillo completo'}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="nums font-display text-3xl font-bold">{Math.round(per.kcal)}</div>
              <div className="text-xs text-muted">kcal · {round(totalGrams / portions)} g</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {([['Proteína', per.protein, COLORS.protein], ['Carbs', per.carbs, COLORS.carbs], ['Grasa', per.fat, COLORS.fat]] as const).map(([l, v, c]) => (
                <div key={l}>
                  <div className="nums text-lg font-semibold">{round(v, 1)}<span className="text-xs text-muted">g</span></div>
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pb-2">
        {draft.id && (
          <Button variant="danger" className="!px-4" aria-label="Eliminar platillo" onClick={() => { removeCustomFood(draft.id!); onDeleted() }}>
            <IconTrash width={20} height={20} />
          </Button>
        )}
        <Button className="flex-1" disabled={!valid} onClick={save}>Guardar platillo</Button>
      </div>
      <p className="text-center text-xs text-muted">Se guarda en <b className="text-soft">Mis alimentos</b> para registrarlo con un toque.</p>
    </div>
  )
}

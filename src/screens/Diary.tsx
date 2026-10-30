import { useMemo, useState } from 'react'
import { entriesFor, useStore } from '../store'
import { calcTargets, entryMacros, round, totalsFor } from '../lib/calc'
import { addDays, relativeLabel, today } from '../lib/date'
import { COLORS, MEALS } from '../lib/meals'
import type { LogEntry, MealType } from '../lib/types'
import { Header } from '../components/Header'
import { Card, MacroBar } from '../components/ui'
import { IconChevronL, IconChevronR, IconCopy, IconPlus, IconTrash } from '../components/Icons'

interface Props {
  date: string
  setDate: (d: string) => void
  onAdd: (m: MealType) => void
  onEdit: (e: LogEntry) => void
}

export function Diary({ date, setDate, onAdd, onEdit }: Props) {
  const profile = useStore((s) => s.profile)!
  const entries = useStore((s) => s.entries)
  const removeEntry = useStore((s) => s.removeEntry)
  const copyMeal = useStore((s) => s.copyMeal)
  const [toast, setToast] = useState('')
  const t = useMemo(() => calcTargets(profile), [profile])
  const list = useMemo(() => entriesFor(entries, date), [entries, date])
  const prev = useMemo(() => entriesFor(entries, addDays(date, -1)), [entries, date])
  const totals = totalsFor(list)

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 1800) }

  return (
    <div className="animate-rise">
      <Header title="Diario" subtitle="Historial de alimentación" />

      <div className="px-4">
        {/* Selector de fecha */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-line bg-card p-1.5">
          <button onClick={() => setDate(addDays(date, -1))} className="grid h-10 w-10 place-items-center rounded-xl text-soft active:bg-card-2" aria-label="Día anterior"><IconChevronL /></button>
          <label className="relative flex-1 text-center">
            <span className="font-medium">{relativeLabel(date)}</span>
            <input type="date" value={date} max={addDays(today(), 7)} onChange={(e) => e.target.value && setDate(e.target.value)}
              className="absolute inset-0 opacity-0" aria-label="Elegir fecha" />
          </label>
          <button onClick={() => setDate(addDays(date, 1))} className="grid h-10 w-10 place-items-center rounded-xl text-soft active:bg-card-2" aria-label="Día siguiente"><IconChevronR /></button>
        </div>

        {/* Resumen del día */}
        <Card className="mb-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm text-muted">Total del día</span>
            <span className="nums font-display text-xl font-semibold">{Math.round(totals.kcal)} <span className="text-sm font-normal text-muted">/ {t.kcal} kcal</span></span>
          </div>
          <div className="space-y-2.5">
            <MacroBar label="Proteína" value={totals.protein} target={t.protein} color={COLORS.protein} />
            <MacroBar label="Carbohidratos" value={totals.carbs} target={t.carbs} color={COLORS.carbs} />
            <MacroBar label="Grasa" value={totals.fat} target={t.fat} color={COLORS.fat} />
          </div>
        </Card>

        <div className="space-y-3">
          {MEALS.map((m) => {
            const items = list.filter((e) => e.meal === m.id).sort((a, b) => a.createdAt - b.createdAt)
            const mt = totalsFor(items)
            const prevCount = prev.filter((e) => e.meal === m.id).length
            return (
              <Card key={m.id} className="!p-0">
                <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
                  <div>
                    <h3 className="font-display font-semibold">{m.label}</h3>
                    <p className="nums text-xs text-muted">
                      {Math.round(mt.kcal)} kcal · P {Math.round(mt.protein)} · C {Math.round(mt.carbs)} · G {Math.round(mt.fat)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {items.length === 0 && prevCount > 0 && (
                      <button onClick={() => { const n = copyMeal(addDays(date, -1), date, m.id); flash(`${n} alimento${n > 1 ? 's' : ''} copiado${n > 1 ? 's' : ''}`) }}
                        className="flex h-9 items-center gap-1 rounded-full bg-card-2 px-3 text-xs text-soft active:scale-95" title="Copiar del día anterior">
                        <IconCopy width={15} height={15} /> Ayer
                      </button>
                    )}
                    <button onClick={() => onAdd(m.id)} aria-label={`Agregar a ${m.label}`}
                      className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-brand active:scale-95">
                      <IconPlus width={18} height={18} />
                    </button>
                  </div>
                </div>
                {items.length > 0 && (
                  <ul className="border-t border-line">
                    {items.map((e) => {
                      const mm = entryMacros(e)
                      return (
                        <li key={e.id} className="flex items-center border-b border-line/60 last:border-0">
                          <button onClick={() => onEdit(e)} className="min-w-0 flex-1 px-4 py-3 text-left active:bg-card-2">
                            <div className="truncate text-[15px]">{e.food.name}</div>
                            <div className="nums truncate text-xs text-muted">
                              {e.servingLabel === 'g' ? `${round(e.grams)} g` : `${round(e.quantity, 2)} × ${e.servingLabel} (${round(e.grams)} g)`}
                              {e.food.brand ? ` · ${e.food.brand}` : ''}
                            </div>
                          </button>
                          <div className="nums pr-1 text-right text-sm">
                            <div className="font-semibold">{Math.round(mm.kcal)}</div>
                            <div className="text-[11px] text-muted">{round(mm.protein, 1)} g P</div>
                          </div>
                          <button onClick={() => removeEntry(e.id)} aria-label="Eliminar" className="grid h-12 w-11 place-items-center text-muted active:text-red-400">
                            <IconTrash width={18} height={18} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {toast && (
        <div className="animate-rise fixed inset-x-0 bottom-28 z-50 mx-auto w-fit rounded-full border border-line bg-card-2 px-4 py-2 text-sm shadow-xl">{toast}</div>
      )}
    </div>
  )
}

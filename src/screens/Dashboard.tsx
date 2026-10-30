import { useMemo } from 'react'
import { activeWeights, entriesFor, useStore } from '../store'
import { calcTargets, totalsFor } from '../lib/calc'
import { capFirst, lastNDays, shortDay, shortDate, today, fromISODate } from '../lib/date'
import { COLORS, MEALS } from '../lib/meals'
import type { MealType } from '../lib/types'
import { Header } from '../components/Header'
import { Ring } from '../components/Ring'
import { Card } from '../components/ui'
import { BarChart, Sparkline } from '../components/Charts'
import { IconChevronR, IconPlus, IconSparkle } from '../components/Icons'
import type { Tab } from '../components/BottomNav'

export function Dashboard({ onAdd, onGo }: { onAdd: (m: MealType) => void; onGo: (t: Tab) => void }) {
  const profile = useStore((s) => s.profile)!
  const entries = useStore((s) => s.entries)
  const weightsAll = useStore((s) => s.weights)
  const isDemo = useStore((s) => s.isDemo)
  const t = useMemo(() => calcTargets(profile), [profile])
  const date = today()

  const todays = useMemo(() => entriesFor(entries, date), [entries, date])
  const totals = totalsFor(todays)
  const remaining = t.kcal - totals.kcal

  const week = useMemo(() => lastNDays(7).map((d) => ({
    label: shortDay(d),
    sub: shortDate(d),
    value: totalsFor(entriesFor(entries, d)).kcal,
  })), [entries])
  const logged = week.filter((d) => d.value > 0)
  const avg = logged.length ? logged.reduce((a, d) => a + d.value, 0) / logged.length : 0

  const weights = useMemo(() => activeWeights(weightsAll), [weightsAll])
  const last30 = weights.slice(-30)
  const wNow = weights.at(-1)?.kg
  const wDelta = last30.length > 1 ? last30.at(-1)!.kg - last30[0].kg : 0

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const subtitle = capFirst(fromISODate(date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }))

  const macros = [
    { key: 'protein', label: 'Proteína', value: totals.protein, target: t.protein, color: COLORS.protein },
    { key: 'carbs', label: 'Carbs', value: totals.carbs, target: t.carbs, color: COLORS.carbs },
    { key: 'fat', label: 'Grasa', value: totals.fat, target: t.fat, color: COLORS.fat },
  ] as const

  return (
    <div className="animate-rise">
      <Header subtitle={subtitle} title={profile.name ? `${greet}, ${profile.name}` : greet} />

      <div className="space-y-4 px-4">
        {isDemo && (
          <button onClick={() => onGo('perfil')}
            className="flex w-full items-center gap-3 rounded-2xl border border-brand-2/30 bg-brand-2/10 px-4 py-3 text-left text-sm">
            <IconSparkle className="shrink-0 text-brand-2" />
            <span className="flex-1 text-soft">Estás viendo <b className="text-ink">datos de ejemplo</b>. Configura tu perfil para empezar.</span>
            <IconChevronR className="text-muted" />
          </button>
        )}

        {/* Calorías */}
        <section className="glow rounded-[28px] border border-line p-5">
          <div className="flex items-center gap-5">
            <Ring value={totals.kcal} target={t.kcal} size={156} stroke={14} color={COLORS.kcal} color2={COLORS.kcal2}>
              <div>
                <div className="nums font-display text-[34px] font-bold leading-none">{Math.abs(Math.round(remaining))}</div>
                <div className="mt-1 text-xs text-muted">{remaining >= 0 ? 'kcal restantes' : 'kcal excedidas'}</div>
              </div>
            </Ring>
            <dl className="flex-1 space-y-3 text-sm">
              <Stat label="Objetivo" value={t.kcal} />
              <Stat label="Consumido" value={Math.round(totals.kcal)} accent />
              <Stat label="Mantenimiento" value={t.tdee} />
            </dl>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
            {macros.map((m) => (
              <div key={m.key} className="flex flex-col items-center">
                <Ring value={m.value} target={m.target} size={76} stroke={7} color={m.color}>
                  <div className="nums text-sm font-semibold">{Math.round(m.value)}<span className="text-[10px] text-muted">g</span></div>
                </Ring>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />{m.label}
                </div>
                <div className="nums text-[11px] text-muted">
                  {m.value > m.target ? `+${Math.round(m.value - m.target)} g` : `${Math.round(m.target - m.value)} g rest.`}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comidas de hoy */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-display text-lg font-semibold">Comidas de hoy</h2>
            <button className="text-sm text-brand" onClick={() => onGo('diario')}>Ver diario</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MEALS.map((m) => {
              const list = todays.filter((e) => e.meal === m.id)
              const tt = totalsFor(list)
              return (
                <Card key={m.id} className="relative !p-3.5">
                  <div className="text-[13px] text-muted">{m.label}</div>
                  <div className="nums mt-0.5 font-display text-xl font-semibold">{Math.round(tt.kcal)} <span className="text-xs font-normal text-muted">kcal</span></div>
                  <div className="mt-1 truncate pr-9 text-[11px] text-muted">
                    {list.length ? `${list.length} alimento${list.length > 1 ? 's' : ''} · ${Math.round(tt.protein)} g prot.` : 'Sin registros'}
                  </div>
                  <button onClick={() => onAdd(m.id)} aria-label={`Agregar a ${m.label}`}
                    className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-brand/15 text-brand active:scale-95">
                    <IconPlus width={18} height={18} />
                  </button>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Semana */}
        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold">Calorías · 7 días</h2>
            <span className="nums text-xs text-muted">Promedio <b className="text-ink">{Math.round(avg)}</b> kcal</span>
          </div>
          <BarChart data={week} target={t.kcal} />
        </Card>

        {/* Peso */}
        <button onClick={() => onGo('peso')} className="block w-full text-left">
          <Card className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[13px] text-muted">Peso actual</div>
              <div className="nums font-display text-2xl font-semibold">{(wNow ?? profile.weightKg).toFixed(1)} <span className="text-sm font-normal text-muted">kg</span></div>
              {last30.length > 1 && (
                <div className={`nums text-xs ${wDelta <= 0 ? 'text-brand' : 'text-carbs'}`}>
                  {wDelta > 0 ? '+' : ''}{wDelta.toFixed(1)} kg en {Math.max(1, Math.round((+fromISODate(last30.at(-1)!.date) - +fromISODate(last30[0].date)) / 864e5))} días
                </div>
              )}
            </div>
            <div className="w-28"><Sparkline values={last30.map((w) => w.kg)} /></div>
            <IconChevronR className="text-muted" />
          </Card>
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`nums font-display text-lg font-semibold ${accent ? 'text-brand' : ''}`}>{value.toLocaleString('es-MX')} <span className="text-xs font-normal text-muted">kcal</span></dd>
    </div>
  )
}

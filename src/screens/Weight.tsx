import { useMemo, useState } from 'react'
import { activeWeights, useStore } from '../store'
import { addDays, fromISODate, relativeLabel, shortDate, today } from '../lib/date'
import { Header } from '../components/Header'
import { Button, Card, Empty, Label, NumberField, Segmented } from '../components/ui'
import { LineChart } from '../components/Charts'
import { IconScale, IconTrash } from '../components/Icons'

type Range = '7' | '30' | '90' | 'all'

export function WeightScreen() {
  const weightsAll = useStore((s) => s.weights)
  const profile = useStore((s) => s.profile)!
  const logWeight = useStore((s) => s.logWeight)
  const removeWeight = useStore((s) => s.removeWeight)
  const weights = useMemo(() => activeWeights(weightsAll), [weightsAll])
  const [range, setRange] = useState<Range>('30')
  const [date, setDate] = useState(today())
  const [kg, setKg] = useState<number>(weights.at(-1)?.kg ?? profile.weightKg)
  const [showAll, setShowAll] = useState(false)

  const from = range === 'all' ? '0000-00-00' : addDays(today(), -Number(range) + 1)
  const inRange = weights.filter((w) => w.date >= from)
  const points = inRange.map((w) => ({ x: w.date, label: shortDate(w.date), value: w.kg }))

  const first = inRange[0], last = inRange.at(-1)
  const delta = first && last ? last.kg - first.kg : 0
  const days = first && last ? Math.max(1, (+fromISODate(last.date) - +fromISODate(first.date)) / 864e5) : 1
  const perWeek = (delta / days) * 7
  const bmi = last ? last.kg / (profile.heightCm / 100) ** 2 : 0

  // Promedios semanales (lunes a domingo)
  const weekly = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const w of weights) {
      const d = fromISODate(w.date)
      const monday = addDays(w.date, -((d.getDay() + 6) % 7))
      map.set(monday, [...(map.get(monday) ?? []), w.kg])
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8)
      .map(([wk, arr]) => ({ week: wk, avg: arr.reduce((a, b) => a + b, 0) / arr.length, n: arr.length }))
  }, [weights])

  const existing = weights.find((w) => w.date === date)
  const list = [...weights].reverse()

  return (
    <div className="animate-rise">
      <Header title="Peso corporal" subtitle="Progreso" />
      <div className="space-y-4 px-4">
        <Card className="glow">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Actual" value={last ? last.kg.toFixed(1) : '—'} unit="kg" />
            <Metric label="Cambio" value={inRange.length > 1 ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : '—'} unit="kg"
              tone={inRange.length > 1 ? (delta <= 0 ? 'good' : 'warn') : undefined} />
            <Metric label="Ritmo" value={inRange.length > 1 ? `${perWeek > 0 ? '+' : ''}${perWeek.toFixed(2)}` : '—'} unit="kg/sem" />
          </div>
          <Segmented className="mt-4" value={range} onChange={setRange}
            options={[{ value: '7', label: 'Semana' }, { value: '30', label: 'Mes' }, { value: '90', label: '3 meses' }, { value: 'all', label: 'Todo' }]} />
          <div className="mt-3">
            {points.length ? <LineChart points={points} showTrend={range !== '7'} /> : <p className="py-10 text-center text-sm text-muted">Sin registros en este periodo.</p>}
          </div>
          {points.length > 2 && range !== '7' && (
            <div className="mt-2 flex justify-center gap-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-kcal opacity-60" />Diario</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-protein" />Tendencia (media 7)</span>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-display font-semibold">Registrar peso</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Fecha</Label><input type="date" className="field" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} /></div>
            <div><Label>Peso</Label><NumberField value={kg} onChange={setKg} suffix="kg" step={0.1} /></div>
          </div>
          <Button className="mt-3 w-full" disabled={!(kg > 20 && kg < 400)} onClick={() => logWeight(date, Math.round(kg * 10) / 10)}>
            {existing ? 'Actualizar registro' : 'Guardar peso'}
          </Button>
          <p className="mt-2 text-xs text-muted">Pésate en ayunas, después de ir al baño, para comparar mejor. Tu objetivo calórico se ajusta con el último peso.</p>
        </Card>

        {weekly.length > 0 && (
          <Card>
            <h2 className="mb-2 font-display font-semibold">Promedio semanal</h2>
            <ul className="divide-y divide-line/60">
              {weekly.map((w, i) => {
                const prev = weekly[i + 1]
                const d = prev ? w.avg - prev.avg : null
                return (
                  <li key={w.week} className="nums flex items-center justify-between py-2.5 text-sm">
                    <span className="text-soft">Semana del {shortDate(w.week)} <span className="text-xs text-muted">({w.n})</span></span>
                    <span className="flex items-center gap-3">
                      {d !== null && <span className={`text-xs ${d <= 0 ? 'text-brand' : 'text-carbs'}`}>{d > 0 ? '+' : ''}{d.toFixed(2)}</span>}
                      <b className="font-semibold">{w.avg.toFixed(1)} kg</b>
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        <Card className="!p-0">
          <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
            <h2 className="font-display font-semibold">Historial</h2>
            {last && <span className="text-xs text-muted">IMC {bmi.toFixed(1)}</span>}
          </div>
          {list.length === 0 ? (
            <Empty icon={<IconScale />} title="Aún no hay registros" text="Registra tu peso para ver tu progreso." />
          ) : (
            <ul>
              {(showAll ? list : list.slice(0, 10)).map((w) => (
                <li key={w.id} className="flex items-center border-t border-line/60 pl-4">
                  <span className="flex-1 py-3 text-sm text-soft">{relativeLabel(w.date)}</span>
                  <span className="nums font-semibold">{w.kg.toFixed(1)} kg</span>
                  <button onClick={() => removeWeight(w.id)} aria-label="Eliminar" className="grid h-11 w-12 place-items-center text-muted active:text-red-400"><IconTrash width={17} height={17} /></button>
                </li>
              ))}
            </ul>
          )}
          {list.length > 10 && (
            <button onClick={() => setShowAll(!showAll)} className="w-full border-t border-line/60 py-3 text-sm text-brand">
              {showAll ? 'Ver menos' : `Ver los ${list.length} registros`}
            </button>
          )}
        </Card>
      </div>
    </div>
  )
}

function Metric({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: 'good' | 'warn' }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`nums font-display text-2xl font-semibold ${tone === 'good' ? 'text-brand' : tone === 'warn' ? 'text-carbs' : ''}`}>{value}</div>
      <div className="text-[11px] text-muted">{unit}</div>
    </div>
  )
}

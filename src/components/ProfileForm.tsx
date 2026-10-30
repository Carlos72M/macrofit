import { useMemo, useState } from 'react'
import type { ActivityLevel, Goal, Profile } from '../lib/types'
import { ACTIVITY, GOALS, KCAL_PER_G, calcTargets } from '../lib/calc'
import { COLORS } from '../lib/meals'
import { Button, Card, Label, NumberField, Segmented } from './ui'

type Draft = Omit<Profile, 'updatedAt'>

export function ProfileForm({ initial, onSave, cta = 'Guardar perfil' }: { initial: Draft; onSave: (p: Draft) => void; cta?: string }) {
  const [d, setD] = useState<Draft>(initial)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const valid = d.age >= 14 && d.age <= 100 && d.heightCm >= 120 && d.heightCm <= 230 && d.weightKg >= 30 && d.weightKg <= 300
  const pctSum = d.percent.protein + d.percent.carbs + d.percent.fat
  const t = useMemo(() => (valid ? calcTargets({ ...d, updatedAt: 0 }) : null), [d, valid])
  const changed = JSON.stringify(d) !== JSON.stringify(initial)
  const canSave = valid && (d.macroMode === 'protein_first' || pctSum === 100)

  const pct = (g: number, k: number) => (t && t.kcal ? Math.round((g * k * 100) / t.kcal) : 0)
  const carbsLow = t && d.macroMode === 'protein_first' && t.carbs < 50

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 font-display font-semibold">Datos personales</h2>
        <div className="space-y-3">
          <div><Label>Nombre (opcional)</Label><input className="field" value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="¿Cómo te llamamos?" /></div>
          <div><Label>Sexo</Label><Segmented value={d.sex} onChange={(v) => set('sex', v)} options={[{ value: 'male', label: 'Hombre' }, { value: 'female', label: 'Mujer' }]} /></div>
          <div className="grid grid-cols-3 gap-2.5">
            <div><Label>Edad</Label><NumberField value={d.age} onChange={(v) => set('age', v)} suffix="años" /></div>
            <div><Label>Estatura</Label><NumberField value={d.heightCm} onChange={(v) => set('heightCm', v)} suffix="cm" /></div>
            <div><Label>Peso</Label><NumberField value={d.weightKg} onChange={(v) => set('weightKg', v)} suffix="kg" step={0.1} /></div>
          </div>
          {!valid && <p className="text-xs text-carbs">Revisa los datos: edad 14–100, estatura 120–230 cm, peso 30–300 kg.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display font-semibold">Nivel de actividad</h2>
        <div className="space-y-2">
          {(Object.keys(ACTIVITY) as ActivityLevel[]).map((a) => (
            <button key={a} type="button" onClick={() => set('activity', a)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${d.activity === a ? 'border-brand bg-brand/10' : 'border-line bg-card-2'}`}>
              <div>
                <div className="text-[15px] font-medium">{ACTIVITY[a].label}</div>
                <div className="text-xs text-muted">{ACTIVITY[a].detail}</div>
              </div>
              <span className="nums text-xs text-muted">×{ACTIVITY[a].factor}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display font-semibold">Objetivo</h2>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(GOALS) as Goal[]).map((g) => (
            <button key={g} type="button" onClick={() => setD((x) => ({ ...x, goal: g, adjustmentPct: GOALS[g].defaultPct }))}
              className={`rounded-2xl border px-2 py-3 text-center transition ${d.goal === g ? 'border-brand bg-brand/10' : 'border-line bg-card-2'}`}>
              <div className="text-sm font-medium leading-tight">{GOALS[g].label}</div>
              <div className="mt-0.5 text-[11px] text-muted">{GOALS[g].detail}</div>
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Label hint={t ? `${t.kcal - t.tdee > 0 ? '+' : ''}${t.kcal - t.tdee} kcal/día` : undefined}>
            Ajuste calórico: <b className="nums text-ink">{d.adjustmentPct > 0 ? '+' : ''}{d.adjustmentPct}%</b>
          </Label>
          <input type="range" min={-35} max={25} step={1} value={d.adjustmentPct} onChange={(e) => set('adjustmentPct', Number(e.target.value))}
            className="w-full accent-[#34d399]" />
          <div className="flex justify-between text-[11px] text-muted"><span>−35% (agresivo)</span><span>0</span><span>+25%</span></div>
          {d.adjustmentPct < -25 && <p className="mt-2 text-xs text-carbs">Un déficit mayor a 25% puede afectar tu masa muscular y energía. Úsalo por periodos cortos.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display font-semibold">Distribución de macronutrientes</h2>
        <Segmented value={d.macroMode} onChange={(v) => set('macroMode', v)}
          options={[{ value: 'protein_first', label: 'Proteína por kg' }, { value: 'percent', label: 'Porcentajes' }]} />

        {d.macroMode === 'protein_first' ? (
          <div className="mt-4 space-y-4">
            <Slider label="Proteína" value={d.proteinPerKg} min={1.2} max={3.0} step={0.1} color={COLORS.protein}
              display={`${d.proteinPerKg.toFixed(1)} g/kg`} onChange={(v) => set('proteinPerKg', v)}
              hint="1.6–2.2 g/kg es lo recomendado para conservar músculo en déficit." />
            <Slider label="Grasa" value={d.fatPct} min={15} max={40} step={1} color={COLORS.fat}
              display={`${d.fatPct}% de las kcal`} onChange={(v) => set('fatPct', v)} />
            <p className="text-xs text-muted">Los carbohidratos ocupan las calorías restantes.</p>
            {carbsLow && <p className="text-xs text-carbs">Quedan pocos carbohidratos: considera bajar la proteína o la grasa.</p>}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <Slider label="Proteína" value={d.percent.protein} min={10} max={60} step={1} color={COLORS.protein}
              display={`${d.percent.protein}%`} onChange={(v) => set('percent', { ...d.percent, protein: v })} />
            <Slider label="Carbohidratos" value={d.percent.carbs} min={5} max={70} step={1} color={COLORS.carbs}
              display={`${d.percent.carbs}%`} onChange={(v) => set('percent', { ...d.percent, carbs: v })} />
            <Slider label="Grasa" value={d.percent.fat} min={10} max={60} step={1} color={COLORS.fat}
              display={`${d.percent.fat}%`} onChange={(v) => set('percent', { ...d.percent, fat: v })} />
            <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${pctSum === 100 ? 'bg-brand/10 text-brand' : 'bg-carbs/10 text-carbs'}`}>
              <span>Total: {pctSum}%</span>
              {pctSum !== 100 && (
                <button type="button" className="text-xs underline"
                  onClick={() => set('percent', { ...d.percent, carbs: Math.max(0, 100 - d.percent.protein - d.percent.fat) })}>
                  Ajustar carbohidratos
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {t && (
        <Card className="glow">
          <h2 className="mb-3 font-display font-semibold">Tus objetivos diarios</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Res label="Basal (BMR)" value={t.bmr} />
            <Res label="Mantenimiento" value={t.tdee} />
            <Res label="Objetivo" value={t.kcal} accent />
          </div>
          <div className="mt-4 space-y-2">
            {([['Proteína', t.protein, KCAL_PER_G.protein, COLORS.protein], ['Carbohidratos', t.carbs, KCAL_PER_G.carbs, COLORS.carbs], ['Grasa', t.fat, KCAL_PER_G.fat, COLORS.fat]] as const).map(([l, g, k, c]) => (
              <div key={l} className="flex items-center gap-3 rounded-2xl bg-card-2 px-3 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                <span className="flex-1 text-sm">{l}</span>
                <span className="nums text-xs text-muted">{pct(g, k)}% · {(g / d.weightKg).toFixed(1)} g/kg</span>
                <span className="nums w-14 text-right font-semibold">{g} g</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Calculado con Mifflin-St Jeor: BMR = 10×peso + 6.25×estatura − 5×edad {d.sex === 'male' ? '+ 5' : '− 161'}; mantenimiento = BMR × factor de actividad. Son estimaciones: ajusta según tu progreso real de 2–3 semanas.
          </p>
        </Card>
      )}

      <Button className="sticky bottom-28 z-10 w-full" disabled={!canSave || (!changed && cta === 'Guardar perfil')} onClick={() => onSave(d)}>
        {cta === 'Guardar perfil' && !changed ? 'Perfil guardado' : cta}
      </Button>
    </div>
  )
}

function Slider({ label, value, min, max, step, display, onChange, color, hint }:
  { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void; color: string; hint?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between px-1 text-sm">
        <span className="flex items-center gap-2 text-soft"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</span>
        <b className="nums">{display}</b>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full" style={{ accentColor: color }} />
      {hint && <p className="px-1 text-[11px] text-muted">{hint}</p>}
    </div>
  )
}

function Res({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-2 py-2.5 ${accent ? 'bg-brand/15' : 'bg-card-2'}`}>
      <div className={`nums font-display text-xl font-bold ${accent ? 'text-brand' : ''}`}>{value.toLocaleString('es-MX')}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}

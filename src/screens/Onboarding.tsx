import { useState } from 'react'
import { DEFAULT_PROFILE, useStore } from '../store'
import { ProfileForm } from '../components/ProfileForm'
import { Button } from '../components/ui'
import { IconChevronL, IconFlame, IconPlate, IconScale, IconSparkle } from '../components/Icons'
import { today } from '../lib/date'

export function Onboarding() {
  const [step, setStep] = useState<'welcome' | 'profile'>('welcome')
  const loadDemo = useStore((s) => s.loadDemo)
  const saveProfile = useStore((s) => s.saveProfile)
  const logWeight = useStore((s) => s.logWeight)
  const { updatedAt: _u, ...draft } = DEFAULT_PROFILE

  if (step === 'profile') {
    return (
      <div className="mx-auto max-w-[480px] px-4 pb-10">
        <div className="pt-safe flex items-center gap-2 pb-4">
          <button onClick={() => setStep('welcome')} className="grid h-10 w-10 place-items-center rounded-full bg-card-2 text-soft" aria-label="Volver"><IconChevronL /></button>
          <div>
            <p className="text-xs text-muted">Paso 1 de 1</p>
            <h1 className="font-display text-2xl font-bold">Tu perfil</h1>
          </div>
        </div>
        <ProfileForm initial={draft} cta="Comenzar" onSave={(p) => { saveProfile(p); logWeight(today(), p.weightKg) }} />
      </div>
    )
  }

  return (
    <div className="pt-safe pb-safe relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-6">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-brand-2/20 blur-3xl" />

      <div className="relative flex flex-1 flex-col justify-center py-10">
        <img src="/icons/icon.svg" alt="" className="animate-rise mb-6 h-20 w-20 rounded-[22px] shadow-[0_20px_50px_-15px_rgba(52,211,153,.5)]" />
        <h1 className="animate-rise font-display text-[42px] font-bold leading-[1.05] tracking-tight">
          Macro<span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">Fit</span>
        </h1>
        <p className="animate-rise mt-3 text-lg text-soft">Pierde grasa y conserva tu músculo con objetivos claros de calorías y macros.</p>

        <ul className="mt-8 space-y-4">
          {[
            [IconFlame, 'Calorías y macros precisos', 'Mifflin-St Jeor + proteína por kg de peso'],
            [IconPlate, 'Registro rápido de comidas', 'Alimentos y marcas de México, porciones caseras'],
            [IconScale, 'Progreso de peso', 'Gráficas semanales y mensuales con tendencia'],
          ].map(([Icon, t, s], i) => {
            const I = Icon as typeof IconFlame
            return (
              <li key={i} className="animate-rise flex items-center gap-4" style={{ animationDelay: `${120 + i * 80}ms` }}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-card text-brand"><I /></span>
                <div><div className="font-medium">{t as string}</div><div className="text-sm text-muted">{s as string}</div></div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="relative space-y-3 pb-4">
        <Button className="w-full text-[17px]" onClick={() => setStep('profile')}>Configurar mi perfil</Button>
        <Button variant="ghost" className="flex w-full items-center justify-center gap-2" onClick={loadDemo}>
          <IconSparkle width={18} height={18} /> Explorar con datos de ejemplo
        </Button>
        <p className="pt-1 text-center text-xs text-muted">Sin registro. Tus datos se guardan solo en este dispositivo.</p>
      </div>
    </div>
  )
}

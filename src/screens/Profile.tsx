import { useRef, useState } from 'react'
import { useStore, type AppData } from '../store'
import { ProfileForm } from '../components/ProfileForm'
import { Header } from '../components/Header'
import { Button, Card, ConfirmButton } from '../components/ui'
import { IconDb, IconDownload, IconSparkle, IconTrash, IconUpload } from '../components/Icons'
import { today } from '../lib/date'

export function ProfileScreen() {
  const profile = useStore((s) => s.profile)!
  const isDemo = useStore((s) => s.isDemo)
  const saveProfile = useStore((s) => s.saveProfile)
  const importData = useStore((s) => s.importData)
  const resetAll = useStore((s) => s.resetAll)
  const loadDemo = useStore((s) => s.loadDemo)
  const counts = { e: useStore((s) => s.entries.filter((x) => !x.deleted).length), w: useStore((s) => s.weights.filter((x) => !x.deleted).length) }
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [formKey, setFormKey] = useState(0)
  const { updatedAt: _u, ...draft } = profile

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2200) }

  const exportData = () => {
    const s = useStore.getState()
    const data: AppData & { app: string; exportedAt: string } = {
      app: 'MacroFit', exportedAt: new Date().toISOString(),
      profile: s.profile, isDemo: s.isDemo, entries: s.entries, weights: s.weights, customFoods: s.customFoods, recents: s.recents,
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `macrofit-respaldo-${today()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const onImport = async (file: File) => {
    try {
      const d = JSON.parse(await file.text()) as AppData
      if (!Array.isArray(d.entries) || !Array.isArray(d.weights)) throw new Error('formato')
      importData({ profile: d.profile ?? null, isDemo: !!d.isDemo, entries: d.entries, weights: d.weights, customFoods: d.customFoods ?? [], recents: d.recents ?? [] })
      setFormKey((k) => k + 1)
      flash('Respaldo importado')
    } catch {
      flash('El archivo no es un respaldo válido de MacroFit')
    }
  }

  return (
    <div className="animate-rise">
      <Header title="Perfil y objetivos" subtitle="Calculadora" />
      <div className="space-y-4 px-4">
        {isDemo && (
          <Card className="border-brand-2/30 bg-brand-2/10">
            <div className="flex gap-3">
              <IconSparkle className="mt-0.5 shrink-0 text-brand-2" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Modo de ejemplo activo</p>
                <p className="mt-0.5 text-soft">Cuando quieras usar MacroFit de verdad, borra los datos de ejemplo y configura tu perfil desde cero.</p>
                <ConfirmButton variant="ghost" className="mt-3 !py-2.5 text-sm" confirmText="Toca de nuevo para borrar el ejemplo" onConfirm={resetAll}>
                  Empezar con mis datos
                </ConfirmButton>
              </div>
            </div>
          </Card>
        )}

        <ProfileForm key={formKey + profile.updatedAt} initial={draft}
          onSave={(p) => { saveProfile(p); flash('Perfil guardado. Objetivos actualizados.') }} />

        <Card>
          <h2 className="mb-1 flex items-center gap-2 font-display font-semibold"><IconDb width={19} height={19} /> Tus datos</h2>
          <p className="mb-3 text-xs text-muted">
            Se guardan en este dispositivo ({counts.e} registros de comida, {counts.w} de peso). No necesitas cuenta. Haz respaldos periódicos para no perderlos.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" className="flex items-center justify-center gap-2 text-sm" onClick={exportData}><IconDownload width={18} height={18} /> Exportar</Button>
            <Button variant="ghost" className="flex items-center justify-center gap-2 text-sm" onClick={() => fileRef.current?.click()}><IconUpload width={18} height={18} /> Importar</Button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = '' }} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ConfirmButton variant="ghost" className="text-sm" confirmText="¿Reemplazar tus datos?" onConfirm={() => { loadDemo(); setFormKey((k) => k + 1) }}>Datos de ejemplo</ConfirmButton>
            <ConfirmButton variant="danger" className="flex items-center justify-center gap-2 text-sm" confirmText="¿Borrar todo? Toca otra vez" onConfirm={resetAll}>
              <IconTrash width={17} height={17} /> Borrar todo
            </ConfirmButton>
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 font-display font-semibold">Instalar en iPhone</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-soft">
            <li>Abre MacroFit en <b>Safari</b>.</li>
            <li>Toca el botón <b>Compartir</b> (cuadro con flecha).</li>
            <li>Elige <b>Agregar a pantalla de inicio</b>.</li>
          </ol>
          <p className="mt-2 text-xs text-muted">Instalada, se abre a pantalla completa, funciona sin conexión y Safari no borra sus datos.</p>
        </Card>

        <p className="pb-4 text-center text-[11px] text-muted">
          MacroFit v1.0 · Datos nutricionales: base MacroFit (ref. USDA/SMAE) y Open Food Facts (ODbL).<br />
          Esta app no sustituye la orientación de un profesional de la salud.
        </p>
      </div>

      {msg && <div className="animate-rise fixed inset-x-0 bottom-28 z-50 mx-auto w-fit max-w-[90%] rounded-full border border-line bg-card-2 px-4 py-2 text-center text-sm shadow-xl">{msg}</div>}
    </div>
  )
}

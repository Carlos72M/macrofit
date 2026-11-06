import { useState } from 'react'
import { useStore } from './store'
import type { LogEntry, MealType } from './lib/types'
import { today } from './lib/date'
import { mealForNow } from './lib/meals'
import { BottomNav, type Tab } from './components/BottomNav'
import { Dashboard } from './screens/Dashboard'
import { Diary } from './screens/Diary'
import { WeightScreen } from './screens/Weight'
import { ProfileScreen } from './screens/Profile'
import { Onboarding } from './screens/Onboarding'
import { AddFoodFlow } from './screens/AddFood'

export interface AddTarget { date: string; meal: MealType }

export default function App() {
  const profile = useStore((s) => s.profile)
  const [tab, setTab] = useState<Tab>('hoy')
  const [date, setDate] = useState(today())
  const [adding, setAdding] = useState<AddTarget | null>(null)
  const [editing, setEditing] = useState<LogEntry | null>(null)

  if (!profile) return <Onboarding />

  const openAdd = (meal?: MealType, d?: string) => setAdding({ date: d ?? (tab === 'diario' ? date : today()), meal: meal ?? mealForNow() })

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] pb-28">
      {tab === 'hoy' && <Dashboard onAdd={(m) => openAdd(m, today())} onGo={setTab} />}
      {tab === 'diario' && <Diary date={date} setDate={setDate} onAdd={(m) => openAdd(m, date)} onEdit={setEditing} />}
      {tab === 'peso' && <WeightScreen />}
      {tab === 'perfil' && <ProfileScreen />}
      {/* Franja bajo la barra de estado del iPhone para que el contenido no se encime con la hora */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-bg/90 backdrop-blur-xl" />
      <BottomNav tab={tab} onTab={setTab} onAdd={() => openAdd()} />
      <AddFoodFlow target={adding} editing={editing}
        onClose={() => { setAdding(null); setEditing(null) }} />
    </div>
  )
}

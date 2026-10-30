import { IconBook, IconHome, IconPlus, IconScale, IconUser } from './Icons'

export type Tab = 'hoy' | 'diario' | 'peso' | 'perfil'

const ITEMS: { id: Tab; label: string; Icon: typeof IconHome }[] = [
  { id: 'hoy', label: 'Hoy', Icon: IconHome },
  { id: 'diario', label: 'Diario', Icon: IconBook },
  { id: 'peso', label: 'Peso', Icon: IconScale },
  { id: 'perfil', label: 'Perfil', Icon: IconUser },
]

export function BottomNav({ tab, onTab, onAdd }: { tab: Tab; onTab: (t: Tab) => void; onAdd: () => void }) {
  const btn = (i: (typeof ITEMS)[number]) => (
    <button key={i.id} onClick={() => { onTab(i.id); window.scrollTo({ top: 0 }) }}
      className={`flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-medium transition ${tab === i.id ? 'text-brand' : 'text-muted'}`}>
      <i.Icon />
      {i.label}
    </button>
  )
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl pb-safe">
      <div className="mx-auto flex max-w-[480px] items-end px-3 pt-2">
        {ITEMS.slice(0, 2).map(btn)}
        <div className="flex flex-1 justify-center">
          <button onClick={onAdd} aria-label="Registrar alimento"
            className="-mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-[#04110c] shadow-[0_10px_30px_-6px_rgba(52,211,153,.55)] active:scale-95">
            <IconPlus width={26} height={26} strokeWidth={2.4} />
          </button>
        </div>
        {ITEMS.slice(2).map(btn)}
      </div>
    </nav>
  )
}

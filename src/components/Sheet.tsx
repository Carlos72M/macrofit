import { useEffect } from 'react'
import { IconX } from './Icons'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  full?: boolean
}

export function Sheet({ open, onClose, title, children, full }: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="animate-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        className={`animate-sheet relative mx-auto flex w-full max-w-[480px] flex-col rounded-t-[28px] border-t border-line bg-surface pb-safe ${full ? 'h-[94dvh]' : 'max-h-[90dvh]'}`}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" />
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-full bg-card-2 text-soft active:scale-95">
            <IconX width={18} height={18} />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
      </div>
    </div>
  )
}

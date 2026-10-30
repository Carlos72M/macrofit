import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-card p-4 ${className}`}>{children}</div>
}

export function Button({ variant = 'primary', className = '', ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-gradient-to-r from-brand to-brand-2 text-[#04110c] font-semibold shadow-[0_8px_24px_-8px_rgba(52,211,153,.6)]',
    ghost: 'bg-card-2 text-ink border border-line',
    danger: 'bg-red-500/10 text-red-300 border border-red-500/30',
  }[variant]
  return <button {...p} className={`rounded-2xl px-4 py-3.5 transition active:scale-[.98] disabled:opacity-40 ${styles} ${className}`} />
}

export function Segmented<T extends string>({ value, options, onChange, className = '' }:
  { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={`flex rounded-2xl border border-line bg-card-2 p-1 ${className}`}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl px-2 py-2 text-sm font-medium transition ${value === o.value ? 'bg-ink text-[#070b10] shadow' : 'text-muted'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between px-1">
      <span className="text-[13px] font-medium text-soft">{children}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  )
}

export function NumberField({ value, onChange, suffix, step = 1, min, max }:
  { value: number; onChange: (n: number) => void; suffix?: string; step?: number; min?: number; max?: number }) {
  return (
    <div className="relative">
      <input type="number" inputMode="decimal" className="field nums pr-12" value={Number.isFinite(value) ? value : ''}
        step={step} min={min} max={max}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />
      {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
    </div>
  )
}

export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(value / target, 1) * 100 : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-soft">{label}</span>
        <span className="nums text-muted"><b className="font-semibold text-ink">{Math.round(value)}</b> / {target} g</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-card-2 text-muted">{icon}</div>
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

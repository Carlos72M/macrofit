export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <header className="pt-safe flex items-end justify-between px-5 pb-4">
      <div>
        {subtitle && <p className="text-[13px] font-medium text-muted">{subtitle}</p>}
        <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight">{title}</h1>
      </div>
      {right}
    </header>
  )
}

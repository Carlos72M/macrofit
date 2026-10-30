interface Props {
  value: number
  target: number
  size?: number
  stroke?: number
  color: string
  color2?: string
  children?: React.ReactNode
}

/** Indicador circular de progreso. Si se excede el objetivo, el excedente se pinta en rojo. */
export function Ring({ value, target, size = 88, stroke = 9, color, color2, children }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = target > 0 ? value / target : 0
  const main = Math.min(pct, 1)
  const over = pct > 1 ? Math.min(pct - 1, 1) : 0
  const gid = `g-${color.replace('#', '')}-${color2?.replace('#', '') ?? ''}-${size}`

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={color2 ?? color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-line" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${c * main} ${c}`}
          style={{ transition: 'stroke-dasharray .6s cubic-bezier(.2,.9,.3,1)' }} />
        {over > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f87171" strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={`${c * over} ${c}`} opacity={0.9} />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

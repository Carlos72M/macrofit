import { useRef, useState } from 'react'

const W = 340

/** Barras diarias con línea de objetivo y tooltip al tocar. */
export function BarChart({ data, target, height = 150, unit = 'kcal' }:
  { data: { label: string; sub: string; value: number }[]; target: number; height?: number; unit?: string }) {
  const [active, setActive] = useState<number | null>(null)
  const top = 20, bottom = 22
  const max = Math.max(target * 1.15, ...data.map((d) => d.value), 1)
  const ih = height - top - bottom
  const slot = W / data.length
  const bw = Math.min(26, slot - 10)
  const y = (v: number) => top + ih - (v / max) * ih
  const a = active !== null ? data[active] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full select-none" onMouseLeave={() => setActive(null)}>
        <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke="#7d8ea1" strokeDasharray="3 4" strokeWidth={1} />
        <text x={W} y={y(target) - 5} textAnchor="end" fontSize={10} fill="#7d8ea1">Objetivo {Math.round(target)}</text>
        {data.map((d, i) => {
          const x = i * slot + (slot - bw) / 2
          const h = Math.max(d.value > 0 ? 3 : 0, (d.value / max) * ih)
          const over = d.value > target * 1.05
          return (
            <g key={i} onClick={() => setActive(active === i ? null : i)} onMouseEnter={() => setActive(i)}>
              <rect x={i * slot} y={0} width={slot} height={height} fill="transparent" />
              <path
                d={roundedTop(x, top + ih - h, bw, h, 4)}
                fill={over ? '#ec4899' : 'url(#bar-g)'}
                opacity={active === null || active === i ? 1 : 0.45}
              />
              <text x={i * slot + slot / 2} y={height - 6} textAnchor="middle" fontSize={11}
                fill={active === i ? '#eef3f8' : '#7d8ea1'}>{d.label}</text>
            </g>
          )
        })}
        <defs>
          <linearGradient id="bar-g" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#0b8fd0" />
            <stop offset="1" stopColor="#0ea371" />
          </linearGradient>
        </defs>
      </svg>
      {a && active !== null && (
        <div className="pointer-events-none absolute -top-2 rounded-xl border border-line bg-card-2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${((active + 0.5) / data.length) * 100}%`, transform: 'translateX(-50%)' }}>
          <div className="text-muted">{a.sub}</div>
          <div className="nums font-semibold text-ink">{Math.round(a.value)} {unit}</div>
        </div>
      )}
    </div>
  )
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return ''
  const rr = Math.min(r, h, w / 2)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

/** Línea de peso con media móvil, crosshair y tooltip. */
export function LineChart({ points, height = 190, showTrend = true }:
  { points: { x: string; label: string; value: number }[]; height?: number; showTrend?: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState<number | null>(null)
  if (points.length === 0) return null

  const left = 34, right = 8, top = 14, bottom = 22
  const vals = points.map((p) => p.value)
  let lo = Math.min(...vals), hi = Math.max(...vals)
  const pad = Math.max(0.5, (hi - lo) * 0.15)
  lo = Math.floor((lo - pad) * 2) / 2; hi = Math.ceil((hi + pad) * 2) / 2
  const iw = W - left - right, ih = height - top - bottom
  const xAt = (i: number) => left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw)
  const yAt = (v: number) => top + ih - ((v - lo) / (hi - lo || 1)) * ih

  // Media móvil de 7 registros para suavizar la variación diaria (agua, sodio…).
  const trend = points.map((_, i) => {
    const s = points.slice(Math.max(0, i - 6), i + 1)
    return s.reduce((a, p) => a + p.value, 0) / s.length
  })
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join('')
  const ticks = [lo, (lo + hi) / 2, hi]
  const labelIdx = points.length <= 1 ? [0] : [0, Math.floor((points.length - 1) / 2), points.length - 1]

  const onMove = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = ((clientX - r.left) / r.width) * W
    const i = Math.round(((px - left) / iw) * (points.length - 1))
    setActive(Math.max(0, Math.min(points.length - 1, i)))
  }
  const a = active !== null ? points[active] : null

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${height}`} className="w-full touch-pan-y select-none"
        onMouseMove={(e) => onMove(e.clientX)} onMouseLeave={() => setActive(null)}
        onTouchStart={(e) => onMove(e.touches[0].clientX)} onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={() => setTimeout(() => setActive(null), 1600)}>
        <defs>
          <linearGradient id="area-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0ea371" stopOpacity={0.28} />
            <stop offset="1" stopColor="#0ea371" stopOpacity={0} />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={yAt(t)} y2={yAt(t)} stroke="#1f2b38" strokeWidth={1} />
            <text x={left - 6} y={yAt(t) + 3.5} textAnchor="end" fontSize={10} fill="#7d8ea1">{t.toFixed(1)}</text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={xAt(i)} y={height - 5} fontSize={10} fill="#7d8ea1"
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>{points[i].label}</text>
        ))}
        {points.length > 1 && (
          <path d={`${path(vals)}L${xAt(points.length - 1)},${top + ih}L${xAt(0)},${top + ih}Z`} fill="url(#area-g)" />
        )}
        <path d={path(vals)} fill="none" stroke="#0ea371" strokeWidth={2} strokeLinejoin="round" opacity={showTrend ? 0.55 : 1} />
        {showTrend && points.length > 2 && (
          <path d={path(trend)} fill="none" stroke="#0b8fd0" strokeWidth={2} strokeLinejoin="round" />
        )}
        {points.length <= 20 && points.map((p, i) => (
          <circle key={p.x} cx={xAt(i)} cy={yAt(p.value)} r={3} fill="#0ea371" stroke="#131b24" strokeWidth={2} />
        ))}
        {a && active !== null && (
          <g>
            <line x1={xAt(active)} x2={xAt(active)} y1={top} y2={top + ih} stroke="#b4c2d1" strokeWidth={1} opacity={0.5} />
            <circle cx={xAt(active)} cy={yAt(a.value)} r={5} fill="#0ea371" stroke="#131b24" strokeWidth={2} />
          </g>
        )}
      </svg>
      {a && active !== null && (
        <div className="pointer-events-none absolute top-0 rounded-xl border border-line bg-card-2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${(xAt(active) / W) * 100}%`, transform: `translateX(${active > points.length / 2 ? '-105%' : '5%'})` }}>
          <div className="text-muted">{a.label}</div>
          <div className="nums font-semibold text-ink">{a.value.toFixed(1)} kg</div>
          {showTrend && points.length > 2 && <div className="nums text-muted">Tendencia {trend[active].toFixed(1)}</div>}
        </div>
      )}
    </div>
  )
}

/** Mini gráfica sin ejes para tarjetas. */
export function Sparkline({ values, height = 40 }: { values: number[]; height?: number }) {
  if (values.length < 2) return null
  const w = 120
  const lo = Math.min(...values), hi = Math.max(...values)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${(i / (values.length - 1)) * w},${height - 4 - ((v - lo) / (hi - lo || 1)) * (height - 8)}`).join('')
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#0ea371" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

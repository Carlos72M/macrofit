const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => toISODate(new Date())
export const fromISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = fromISODate(s)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}
export const lastNDays = (n: number, end = today()) =>
  Array.from({ length: n }, (_, i) => addDays(end, i - n + 1))

export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function relativeLabel(s: string): string {
  const t = today()
  if (s === t) return 'Hoy'
  if (s === addDays(t, -1)) return 'Ayer'
  if (s === addDays(t, 1)) return 'Mañana'
  return capFirst(fromISODate(s).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', ''))
}

export const shortDay = (s: string) =>
  capFirst(fromISODate(s).toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''))

export const shortDate = (s: string) =>
  fromISODate(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '')

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

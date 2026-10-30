import type { SVGProps } from 'react'

const base = (d: React.ReactNode) => (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.9}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>{d}</svg>
)

export const IconHome = base(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></>)
export const IconBook = base(<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M9 7h6" /></>)
export const IconPlus = base(<><path d="M12 5v14M5 12h14" /></>)
export const IconScale = base(<><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M8.5 9.5a5 5 0 0 1 7 0L13 12" /></>)
export const IconUser = base(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>)
export const IconChevronL = base(<path d="m15 6-6 6 6 6" />)
export const IconChevronR = base(<path d="m9 6 6 6-6 6" />)
export const IconX = base(<path d="M6 6l12 12M18 6 6 18" />)
export const IconSearch = base(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)
export const IconTrash = base(<><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>)
export const IconCopy = base(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>)
export const IconFlame = base(<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" />)
export const IconEdit = base(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>)
export const IconCheck = base(<path d="m5 12 5 5 9-10" />)
export const IconSun = base(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>)
export const IconMoon = base(<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />)
export const IconCoffee = base(<><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M8 3v3M12 3v3" /></>)
export const IconApple = base(<><path d="M12 7c-1.5-1-5-1.2-6 2.3-.9 3.2 1 8.7 3.4 9.6 1.1.4 1.8-.3 2.6-.3s1.5.7 2.6.3c2.4-.9 4.3-6.4 3.4-9.6C17 5.8 13.5 6 12 7z" /><path d="M12 7c0-2 1-3.5 3-4" /></>)
export const IconPlate = base(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /></>)
export const IconDownload = base(<><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></>)
export const IconUpload = base(<><path d="M12 15V4M7 9l5-5 5 5M5 20h14" /></>)
export const IconDb = base(<><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>)
export const IconSparkle = base(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />)
export const IconGlobe = base(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>)

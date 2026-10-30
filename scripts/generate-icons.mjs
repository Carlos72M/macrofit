// Genera los íconos PNG (iOS / Android) a partir de public/icons/icon.svg usando Playwright.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8')
const targets = [
  { file: 'apple-touch-icon.png', size: 180, pad: 0, bg: '#0a0f14', square: true },
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'icon-512-maskable.png', size: 512, pad: 0.12, bg: '#0a0f14', square: true },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2))
  // iOS aplica sus propias esquinas redondeadas: usamos fondo cuadrado.
  const art = t.square ? svg.replace(/rx="112"/, 'rx="0"') : svg
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(`<html><body style="margin:0;background:${t.bg ?? 'transparent'};display:grid;place-items:center;width:${t.size}px;height:${t.size}px">
    <div style="width:${inner}px;height:${inner}px">${art.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`)
  await page.screenshot({ path: new URL(`../public/icons/${t.file}`, import.meta.url).pathname, omitBackground: !t.bg })
}
await browser.close()
console.log('Íconos generados')

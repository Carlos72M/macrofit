import type { Syncable } from '../lib/types'

/**
 * Preparación para sincronización en la nube.
 * Cada registro tiene `id` único, `updatedAt` y borrado lógico (`deleted`), así
 * que dos copias (dispositivo y servidor) se pueden fusionar con la estrategia
 * "la última escritura gana". Un futuro `CloudSync` haría:
 *   1. pull(): descargar cambios desde `lastSyncedAt`
 *   2. mergeRecords(local, remotos)
 *   3. push(): subir los registros locales con updatedAt > lastSyncedAt
 */
export function mergeRecords<T extends Syncable>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>()
  for (const r of local) map.set(r.id, r)
  for (const r of remote) {
    const cur = map.get(r.id)
    if (!cur || r.updatedAt > cur.updatedAt) map.set(r.id, r)
  }
  return [...map.values()]
}

export interface CloudSync {
  pull(since: number): Promise<{ entries: Syncable[]; weights: Syncable[]; customFoods: Syncable[] }>
  push(changes: { entries: Syncable[]; weights: Syncable[]; customFoods: Syncable[] }): Promise<void>
}

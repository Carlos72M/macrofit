import type { StateStorage } from 'zustand/middleware'

/**
 * Capa de persistencia intercambiable. La v1 usa localStorage; para sincronizar
 * en la nube basta con implementar otro adaptador (p. ej. IndexedDB + API REST,
 * Supabase o Firebase) con la misma interfaz y conectarlo en `store/index.ts`.
 */
export interface StorageAdapter extends StateStorage {
  readonly kind: string
}

export const localStorageAdapter: StorageAdapter = {
  kind: 'localStorage',
  getItem: (k) => {
    try { return localStorage.getItem(k) } catch { return null }
  },
  setItem: (k, v) => {
    try { localStorage.setItem(k, v) } catch (e) { console.error('No se pudo guardar', e) }
  },
  removeItem: (k) => {
    try { localStorage.removeItem(k) } catch { /* noop */ }
  },
}

/** Pide al navegador que no borre los datos automáticamente (Safari/Chrome). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true
      return await navigator.storage.persist()
    }
  } catch { /* noop */ }
  return false
}

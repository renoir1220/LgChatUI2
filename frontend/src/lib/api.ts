export const API_BASE = (import.meta as any).env?.VITE_API_BASE || ''

export async function apiGet<T = any>(path: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, { method: 'GET' })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json() as Promise<T>
}


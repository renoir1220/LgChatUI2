import { useEffect, useState } from 'react'
import './App.css'
import { apiGet } from './lib/api'


function App() {
  const [dbHealth, setDbHealth] = useState<'unknown' | 'ok' | 'fail'>('unknown')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await apiGet<{ ok: boolean; error?: string }>(`/health/db`)
        if (!mounted) return
        setDbHealth(res.ok ? 'ok' : 'fail')
        setError(res.ok ? null : res.error || 'unknown error')
      } catch (e: any) {
        if (!mounted) return
        setDbHealth('fail')
        setError(e?.message || 'network error')
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const color = dbHealth === 'ok' ? '#16a34a' : dbHealth === 'fail' ? '#dc2626' : '#6b7280'
  const label = dbHealth === 'ok' ? 'Healthy' : dbHealth === 'fail' ? 'Unhealthy' : 'Unknown'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
        <span>DB Health: {label}</span>
      </div>
      {error && <div style={{ color: '#9ca3af', fontSize: 12 }}>Error: {error}</div>}
    </div>
  )
}

export default App

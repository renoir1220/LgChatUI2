import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { apiPost } from '../../shared/services/api'
import { setAuth } from '../utils/auth'
import logoTree from '../../../assets/logoTree.png'
import type { LoginRequest, LoginResponse } from '@lg/shared'

interface LoginScreenProps {
  onLogin?: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      setError('请输入用户名')
      return
    }
    
    if (trimmedUsername.length < 2) {
      setError('用户名至少需要2个字符')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const loginRequest: LoginRequest = { username: trimmedUsername }
      const response = await apiPost<LoginResponse>('/api/auth/login', loginRequest)
      
      if (response?.access_token) {
        // 保存认证信息到localStorage
        setAuth(response.access_token, trimmedUsername)
        
        // 执行回调并跳转
        onLogin?.()
        navigate('/')
      } else {
        setError('登录失败：未返回访问令牌')
      }
    } catch (e: unknown) {
      const error = e as Error;
      setError(`登录失败：${error?.message || '网络错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-100">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-[38rem] rounded-full bg-gradient-to-tr from-indigo-300/40 to-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-[38rem] rounded-full bg-gradient-to-tr from-cyan-200/40 to-violet-200/30 blur-3xl" />

      {/* Top nav / brand */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2 select-none">
          <img src={logoTree} alt="朗珈软件" className="size-8 rounded-md shadow-md" />
          <span className="text-lg font-semibold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #0EA5E9, #1E40AF)' }}>
            朗珈软件
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 grid w-full items-center gap-10 px-6 pb-16 md:grid-cols-2 md:px-10 lg:gap-16">
        {/* Left branding panel */}
        <div className="mx-auto max-w-xl py-2 md:py-10">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #0EA5E9, #1E40AF)' }}>朗珈GPT</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            开始你的AI聊天之旅
          </p>
        </div>

        {/* Right login card */}
        <div className="mx-auto w-full max-w-md">
          <Card className="border-0 bg-white/80 shadow-xl ring-1 ring-black/5 backdrop-blur-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-xl">欢迎回来</CardTitle>
              <CardDescription className="text-center">输入用户名开始聊天</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-800">
                    用户名
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={50}
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  disabled={loading || !username.trim()}
                >
                  {loading ? '登录中…' : '开始聊天'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, validateToken } from '@/utils/auth'
import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'

interface RequireAuthProps {
  children: ReactElement
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation()
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')

  useEffect(() => {
    async function checkAuth() {
      // 首先检查本地存储
      if (!isAuthenticated()) {
        setAuthState('unauthenticated')
        return
      }

      // 然后验证token是否有效
      const isValid = await validateToken()
      setAuthState(isValid ? 'authenticated' : 'unauthenticated')
    }

    checkAuth()
  }, [])

  // 正在检查认证状态时显示加载状态
  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">验证登录状态...</p>
        </div>
      </div>
    )
  }

  // 未认证时重定向到登录页面
  if (authState === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 已认证时显示子组件
  return children
}
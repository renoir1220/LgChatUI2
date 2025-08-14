import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUsername, clearAuth, validateToken } from '@/utils/auth'
import { LogOut, MessageCircle, User } from 'lucide-react'

export default function ChatScreen() {
  const [messages] = useState([
    { id: 1, user: 'System', content: '欢迎使用LG Chat！你可以在这里开始对话。', time: new Date().toLocaleTimeString() }
  ])
  
  const username = getUsername()

  useEffect(() => {
    // 组件加载时验证token有效性
    async function checkTokenValidity() {
      const isValid = await validateToken()
      if (!isValid) {
        // Token无效，自动跳转到登录页
        window.location.href = '/login'
      }
    }

    checkTokenValidity()
  }, [])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* 侧边栏 */}
      <div className="hidden md:flex md:w-64 lg:w-80 flex-col border-r border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex-1 p-4 space-y-4">
          {/* 用户信息 */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-500 text-white rounded-full">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{username || '用户'}</p>
              <p className="text-sm text-gray-500">在线</p>
            </div>
          </div>

          {/* 聊天历史 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 px-2">聊天记录</h3>
            <div className="p-3 rounded-lg border border-gray-200 bg-white/60">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageCircle className="w-4 h-4" />
                <span>新对话</span>
              </div>
            </div>
          </div>
        </div>

        {/* 退出按钮 */}
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-gray-600 hover:text-red-600 hover:border-red-200"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航 - 移动端显示 */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-500 text-white rounded-full">
              <User className="w-4 h-4" />
            </div>
            <span className="font-medium text-gray-900">{username || '用户'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">{message.user}</span>
                  <span>{message.time}</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-gray-800">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* 开发中提示 */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700">
                <MessageCircle className="w-4 h-4" />
                聊天功能开发中，敬请期待
              </div>
            </div>
          </div>

          {/* 输入区域占位符 */}
          <div className="p-4 border-t border-gray-200 bg-white/60 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-gray-500 text-sm">
                  消息输入框（开发中）
                </div>
                <Button disabled className="px-6">
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
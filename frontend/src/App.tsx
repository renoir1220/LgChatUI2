import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from '@/components/LoginScreen'
import { ChatPage } from '@/components/ChatPage'
import RequireAuth from '@/components/RequireAuth'

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
              <LoginScreen 
                onLogin={() => {
                  // 登录成功后强制刷新页面，确保状态同步
                  window.location.href = '/'
                }} 
              />
            </div>
          } 
        />
        <Route 
          path="/" 
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          } 
        />
        {/* 默认重定向到主页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

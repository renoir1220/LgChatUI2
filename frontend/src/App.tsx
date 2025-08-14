import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from '@/components/LoginScreen'
import ChatScreen from '@/components/ChatScreen'
import RequireAuth from '@/components/RequireAuth'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <LoginScreen 
                onLogin={() => {
                  // 登录成功后强制刷新页面，确保状态同步
                  window.location.href = '/'
                }} 
              />
            } 
          />
          <Route 
            path="/" 
            element={
              <RequireAuth>
                <ChatScreen />
              </RequireAuth>
            } 
          />
          {/* 默认重定向到主页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App

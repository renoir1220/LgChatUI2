import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './features/auth/components/LoginScreen'
import ChatScreenRefactored from './features/chat/components/ChatScreenRefactored'
import RequireAuth from './features/auth/components/RequireAuth'
import { NotificationProvider } from './features/shared/contexts/NotificationContext'
import { SettingsProvider } from './features/shared/contexts/SettingsContext'

function App() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={
                <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #eef2ff)' }}>
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
                  <ChatScreenRefactored />
                </RequireAuth>
              } 
            />
            {/* 默认重定向到主页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </SettingsProvider>
  )
}

export default App

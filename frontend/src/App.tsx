import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginScreen from './features/auth/components/LoginScreen'
import ChatScreenRefactored from './features/chat/components/ChatScreenRefactored'
import InfoFeedPage from './features/infofeed/pages/InfoFeedPage'
import CustomerInfoPage from './features/customer/pages/CustomerInfoPage'
import AdminApp from './features/admin/components/AdminApp'
import RequireAuth from './features/auth/components/RequireAuth'
import { NotificationProvider } from './features/shared/contexts/NotificationContext'
import { SettingsProvider } from './features/shared/contexts/SettingsContext'
import UpdatePrompt from './components/UpdatePrompt'
import { setNavigator } from './features/shared/services/navigation'

function NavBinder() {
  const navigate = useNavigate();
  // Bind global navigator once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { setNavigator(navigate); }, [navigate]);
  return null;
}

function App() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <div className="h-full flex flex-col">
          <Router>
            <NavBinder />
            <Routes>
              <Route 
                path="/login" 
                element={
                  <div className="h-full flex-1" style={{ 
                    background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #eef2ff)',
                    minHeight: '100%'
                  }}>
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
                  <div className="h-full flex-1">
                    <RequireAuth>
                      <ChatScreenRefactored />
                    </RequireAuth>
                  </div>
                } 
              />
              <Route 
                path="/admin/*" 
                element={
                  <div className="h-full flex-1">
                    <RequireAuth>
                      <AdminApp />
                    </RequireAuth>
                  </div>
                } 
              />
              <Route 
                path="/feeds" 
                element={
                  <div className="h-full flex-1">
                    <RequireAuth>
                      <InfoFeedPage />
                    </RequireAuth>
                  </div>
                }
              />
              <Route 
                path="/customer" 
                element={
                  <div className="h-full flex-1">
                    <RequireAuth>
                      <CustomerInfoPage />
                    </RequireAuth>
                  </div>
                }
              />
              {/* 默认重定向到主页 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          {/* PWA更新提示组件，在所有页面全局显示 */}
          <UpdatePrompt />
        </div>
      </NotificationProvider>
    </SettingsProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useShellAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import ShellLayout from './components/ShellLayout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useShellAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <ShellLayout />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/admin/trading/stats" replace />} />
        <Route path="*" element={<Navigate to="/admin/trading/stats" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

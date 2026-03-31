import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AdminLayout from './components/AdminLayout'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import StatsPage from './pages/StatsPage'
import CategoriesPage from './pages/CategoriesPage'
import { useAdminStore } from './store/adminStore'

interface AppProps {
  basename?: string
  globalState?: { token?: string; role?: string }
}

export default function App({ basename = '/', globalState }: AppProps) {
  const setToken = useAdminStore((s) => s.setToken)

  useEffect(() => {
    if (globalState?.token) {
      setToken(globalState.token)
    }
  }, [globalState?.token, setToken])

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/products"   element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/orders"     element={<OrdersPage />} />
          <Route path="/stats"      element={<StatsPage />} />
          <Route path="/"           element={<Navigate to="/stats" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

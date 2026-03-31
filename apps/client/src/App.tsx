import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import OrderListPage from './pages/OrderListPage'
import ProfilePage from './pages/ProfilePage'
import FavoritesPage from './pages/FavoritesPage'
import CommunityPage from './pages/CommunityPage'
import PostDetailPage from './pages/PostDetailPage'
import CreatePostPage from './pages/CreatePostPage'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Public community routes */}
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/posts/create" element={<CreatePostPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

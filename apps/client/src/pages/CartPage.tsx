import { useState, useEffect } from 'react'
import { message } from 'antd'
import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useCartStore } from '../store/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const setCount = useCartStore((s) => s.setCount)

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart')
      setItems(res.data.data.items || [])
      setTotal(res.data.data.total || 0)
      setCount((res.data.data.items || []).length)
    } catch {
      message.error('加载购物车失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCart() }, []) // eslint-disable-line

  const deleteItem = async (id: number) => {
    setDeletingId(id)
    try {
      await api.delete(`/cart/items/${id}`)
      await fetchCart()
    } catch {
      message.error('删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  const checkout = async () => {
    setCheckingOut(true)
    try {
      const res = await api.post('/orders', { from_cart: true })
      await api.post(`/orders/${res.data.data.id}/pay`)
      message.success('支付成功！')
      navigate('/orders')
    } catch (err: any) {
      message.error(err.response?.data?.message || '结算失败')
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div className="app-shell">
      <NavBar title="购物车" />

      <div className="page-content">
        {loading ? (
          <div className="loading-center">
            <div className="spinner-lg" />
            <span style={{ fontSize: 13, color: '#bbb' }}>加载中…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon"><ShoppingOutlined /></span>
            <span className="empty-state-text">购物车空空如也</span>
            <button className="btn btn-primary btn-md" onClick={() => navigate('/')}
              style={{ marginTop: 4 }}>
              去逛逛
            </button>
          </div>
        ) : (
          <div className="cart-list" style={{ animation: 'page-enter 0.28s ease both' }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="cart-item"
                style={{
                  animationDelay: `${idx * 0.05}s`,
                  opacity: deletingId === item.id ? 0.4 : 1,
                  transition: 'opacity 0.2s ease',
                }}
                onClick={() => navigate(`/products/${item.product.id}`)}
              >
                <img
                  className="cart-item-img"
                  src={item.product.image_url}
                  alt={item.product.name}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/76x76?text=?' }}
                />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.product.name}</div>
                  <div className="cart-item-meta">
                    单价 ¥{item.product.price.toFixed(2)} × {item.quantity}
                  </div>
                  <div className="cart-item-subtotal">
                    <span style={{ fontSize: 11, verticalAlign: '2px', marginRight: 1 }}>¥</span>
                    {item.subtotal.toFixed(2)}
                  </div>
                </div>
                <button
                  className="cart-item-del"
                  disabled={deletingId === item.id}
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }}
                >
                  <DeleteOutlined />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout bar — sits above BottomNav */}
      {items.length > 0 && (
        <div className="sticky-bottom-bar" style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>共 {items.length} 件</div>
            <div style={{ fontSize: 13, color: '#333', display: 'flex', alignItems: 'baseline', gap: 2 }}>
              合计：
              <span style={{ color: '#1a1a1a', fontWeight: 700, fontSize: 22, fontFamily: "'Cormorant Garamond', serif" }}>¥</span>
              <span style={{ color: '#1a1a1a', fontWeight: 700, fontSize: 22, fontFamily: "'Cormorant Garamond', serif" }}>{total.toFixed(2)}</span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={checkout}
            disabled={checkingOut}
            style={{ minWidth: 110, opacity: checkingOut ? 0.7 : 1 }}
          >
            {checkingOut ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> 结算中…</> : '去结算'}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

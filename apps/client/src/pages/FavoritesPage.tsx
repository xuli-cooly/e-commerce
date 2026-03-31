import { useState, useEffect, useCallback, useRef } from 'react'
import { message } from 'antd'
import { HeartFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

interface Product {
  id: number
  name: string
  image_url: string
  price: number
  stock: number
  original_price?: number
}

interface Favorite {
  id: number
  product_id: number
  product: Product
  created_at: string
}

const PAGE_SIZE = 20

export default function FavoritesPage() {
  const navigate = useNavigate()
  const [favs, setFavs] = useState<Favorite[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasMore = favs.length < total
  const loadMoreRef = useRef({ hasMore: false, loading: false, page: 1 })
  loadMoreRef.current = { hasMore, loading, page }

  const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
    setLoading(true)
    try {
      const res = await api.get('/favorites', { params: { page: pageNum, size: PAGE_SIZE } })
      const { list = [], total: t = 0 } = res.data.data
      setTotal(t)
      setFavs((prev) => (replace ? list : [...prev, ...list]))
      setPage(pageNum)
    } catch {
      message.error('加载收藏失败')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => { fetchPage(1, true) }, []) // eslint-disable-line

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        const { hasMore: hm, loading: ld, page: pg } = loadMoreRef.current
        if (hm && !ld) fetchPage(pg + 1, false)
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage, favs.length])

  const handleUnfavorite = async (e: React.MouseEvent, productID: number) => {
    e.stopPropagation()
    try {
      await api.post('/favorites', { product_id: productID })
      setFavs((prev) => prev.filter((f) => f.product_id !== productID))
      setTotal((t) => t - 1)
      message.success('已取消收藏')
    } catch {
      message.error('操作失败')
    }
  }

  if (initialLoading) {
    return (
      <div className="app-shell">
        <NavBar title="我的收藏" back />
        <div className="loading-center">
          <div className="spinner-lg" />
          <span style={{ fontSize: 13, color: '#bbb' }}>加载中…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <NavBar title={`我的收藏${total > 0 ? ` (${total})` : ''}`} back />

      <div style={{ flex: 1, overflowY: 'auto', background: '#FAF8F5', paddingBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }}>
        {favs.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <span className="empty-state-icon">💝</span>
            <span className="empty-state-text">还没有收藏任何商品</span>
            <button className="btn btn-primary btn-md" onClick={() => navigate('/')} style={{ marginTop: 4 }}>
              去发现好物
            </button>
          </div>
        ) : (
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {favs.map((fav, idx) => {
              const p = fav.product
              return (
                <div
                  key={fav.id}
                  className="fav-item"
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    cursor: 'pointer',
                    border: '1px solid #EBEBEB',
                    animationDelay: `${idx * 0.04}s`,
                  }}
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: '#f0f0f0' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/76?text=N/A' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 5,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4,
                    }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', fontFamily: "'Cormorant Garamond', serif" }}>¥{p.price.toFixed(2)}</span>
                      {p.original_price != null && p.original_price > p.price && (
                        <span style={{ fontSize: 12, color: '#bbb', textDecoration: 'line-through' }}>
                          ¥{p.original_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {p.stock > 0 && p.stock <= 10 && (
                      <span style={{ fontSize: 11, color: '#fa8c16', fontWeight: 500 }}>仅剩 {p.stock} 件</span>
                    )}
                    {p.stock === 0 && (
                      <span style={{ fontSize: 11, color: '#ff4d4f' }}>暂时缺货</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleUnfavorite(e, p.id)}
                    style={{
                      background: 'none', border: 'none', padding: 8,
                      fontSize: 22, color: '#ff4d4f', cursor: 'pointer',
                      flexShrink: 0, borderRadius: '50%',
                      transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                    onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.8)' }}
                    onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                  >
                    <HeartFilled />
                  </button>
                </div>
              )
            })}

            {hasMore && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px', gap: 6 }}>
                {loading && <><span className="spinner" /><span style={{ fontSize: 13, color: '#bbb' }}>加载中…</span></>}
                {!loading && <span style={{ fontSize: 13, color: '#ccc' }}>上滑加载更多</span>}
              </div>
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

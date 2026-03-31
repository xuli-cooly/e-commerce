import { useState, useEffect, useRef, useCallback } from 'react'
import { message } from 'antd'
import {
  ShoppingCartOutlined, ThunderboltOutlined,
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  HeartOutlined, HeartFilled,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import NavBar from '../components/NavBar'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

interface Product {
  id: number
  name: string
  description: string
  image_url: string
  price: number
  original_price?: number
  promotion_end_at?: string
  stock: number
  category_id?: number
}

interface Review {
  id: number
  user_id: number
  rating: number
  content: string
  created_at: string
  user: { id: number; phone: string }
}

interface ReviewStats {
  avg_rating: number
  total: number
  distribution: [number, number, number, number, number]
}

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(endAt: string | undefined) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    if (!endAt) return
    const calc = () => {
      const diff = new Date(endAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining(''); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [endAt])
  return remaining
}

// ── Star component ─────────────────────────────────────────────────────────────
function Stars({ value, size = 14, interactive = false, onChange }: {
  value: number; size?: number; interactive?: boolean; onChange?: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const display = interactive && hovered > 0 ? hovered : value
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star${display >= s ? ' filled' : ''}`}
          style={{ cursor: interactive ? 'pointer' : 'default', transition: 'transform 0.1s' }}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(s)}
        >★</span>
      ))}
    </span>
  )
}

// ── Rating bar ─────────────────────────────────────────────────────────────────
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#aaa', width: 24, textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div className="rating-bar-track">
        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: 11, color: '#bbb', width: 20, flexShrink: 0 }}>{count}</span>
    </div>
  )
}

// ── Qty stepper ────────────────────────────────────────────────────────────────
function QtyStepper({ value, min = 1, max = 999, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void
}) {
  return (
    <div className="qty-stepper">
      <button className="qty-btn" disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span className="qty-val">{value}</span>
      <button className="qty-btn" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [relatedPosts, setRelatedPosts] = useState<{ id: number; title: string; image_urls: string[] }[]>([])
  const [relatedPostsTotal, setRelatedPostsTotal] = useState(0)
  const [qty, setQty] = useState(1)
  const [isFavorited, setIsFavorited] = useState(false)
  const [heartAnimate, setHeartAnimate] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [rating, setRating] = useState(0)
  const [reviewContent, setReviewContent] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [addingCart, setAddingCart] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)

  const increment = useCartStore((s) => s.increment)
  const { token } = useAuthStore()
  const countdown = useCountdown(product?.promotion_end_at)

  const isPromoActive = product?.promotion_end_at
    ? new Date(product.promotion_end_at).getTime() > Date.now()
    : true
  const showPromo = product?.original_price != null &&
    product.original_price > product.price &&
    isPromoActive

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((r) => {
        setProduct(r.data.data.product)
        setRelatedProducts(r.data.data.related_products || [])
      })
      .catch(() => message.error('商品不存在'))
  }, [id])

  useEffect(() => {
    if (!id) return
    api.get('/posts', { params: { product_id: id, size: 3 } })
      .then((r) => {
        setRelatedPosts(r.data.data.list || [])
        setRelatedPostsTotal(r.data.data.total || 0)
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!id) return
    api.get(`/products/${id}/reviews`, { params: { page: 1, size: 3 } })
      .then((r) => setReviews(r.data.data.list || []))
      .catch(() => {})
    api.get(`/products/${id}/reviews/stats`)
      .then((r) => setReviewStats(r.data.data))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!token || !id) return
    api.get('/favorites/check', { params: { product_id: Number(id) } })
      .then((r) => setIsFavorited(r.data.data.is_favorited))
      .catch(() => {})
    setCanReview(true)
  }, [token, id])

  const addToCart = async () => {
    setAddingCart(true)
    try {
      await api.post('/cart/items', { product_id: Number(id), quantity: qty })
      increment()
      message.success('已加入购物车')
    } catch (err: any) {
      message.error(err.response?.data?.message || '加购失败')
    } finally {
      setAddingCart(false)
    }
  }

  const buyNow = async () => {
    setBuyingNow(true)
    try {
      const res = await api.post('/orders', { items: [{ product_id: Number(id), quantity: qty }] })
      await api.post(`/orders/${res.data.data.id}/pay`)
      message.success('支付成功！')
      navigate('/orders')
    } catch (err: any) {
      message.error(err.response?.data?.message || '下单失败')
    } finally {
      setBuyingNow(false)
    }
  }

  const toggleFavorite = async () => {
    if (!token) { message.info('请先登录'); return }
    try {
      const res = await api.post('/favorites', { product_id: Number(id) })
      setIsFavorited(res.data.data.is_favorited)
      setHeartAnimate(true)
      setTimeout(() => setHeartAnimate(false), 350)
      message.success(res.data.data.is_favorited ? '已加入收藏' : '已取消收藏')
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败')
    }
  }

  const submitReview = async () => {
    if (rating === 0) { message.warning('请选择评分'); return }
    setSubmittingReview(true)
    try {
      await api.post(`/products/${id}/reviews`, { rating, content: reviewContent })
      message.success('评价已提交')
      setCanReview(false)
      setRating(0)
      setReviewContent('')
      const [rRes, sRes] = await Promise.all([
        api.get(`/products/${id}/reviews`, { params: { page: 1, size: 3 } }),
        api.get(`/products/${id}/reviews/stats`),
      ])
      setReviews(rRes.data.data.list || [])
      setReviewStats(sRes.data.data)
    } catch (err: any) {
      message.error(err.response?.data?.message || '评价失败')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (!product) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-center">
          <div className="spinner-lg" />
          <span style={{ fontSize: 13, color: '#bbb' }}>加载中…</span>
        </div>
      </div>
    )
  }

  const stock = product.stock
  const inStock = stock > 0

  const StockBadge = () => {
    if (stock === 0) return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#ff4d4f' }}>
        <CloseCircleOutlined /> 暂时缺货
      </span>
    )
    if (stock <= 10) return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#fa8c16', fontWeight: 600 }}>
        <WarningOutlined /> 仅剩 {stock} 件，手慢无！
      </span>
    )
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#52c41a' }}>
        <CheckCircleOutlined /> 库存充足
      </span>
    )
  }

  return (
    <div className="app-shell">
      <NavBar
        title={product.name}
        back
        right={
          <span
            onClick={toggleFavorite}
            className={heartAnimate ? 'heart-pop' : ''}
            style={{ cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center' }}
          >
            {isFavorited
              ? <HeartFilled style={{ color: '#ff4d4f' }} />
              : <HeartOutlined style={{ color: 'rgba(255,255,255,0.9)' }} />
            }
          </span>
        }
      />

      <div style={{ paddingBottom: 120, overflowY: 'auto', flex: 1, animation: 'page-enter 0.28s ease both' }}>
        {/* Hero image */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', background: '#f0f0f0' }}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/540x405?text=No+Image' }}
          />
          {!inStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>已售罄</span>
            </div>
          )}
        </div>

        {/* Price & title */}
        <div style={{ background: '#fff', padding: '16px 16px 14px' }}>
          {showPromo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#bbb', textDecoration: 'line-through' }}>
                ¥{product.original_price!.toFixed(2)}
              </span>
              <span className="promo-tag">促销</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span style={{ fontSize: 16, color: '#1a1a1a', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif" }}>¥</span>
            <span style={{ fontSize: 30, fontWeight: 400, color: '#1a1a1a', lineHeight: 1, fontFamily: "'Cormorant Garamond', serif" }}>
              {product.price.toFixed(2)}
            </span>
          </div>
          {showPromo && product.promotion_end_at && countdown && (
            <div style={{ marginBottom: 8 }}>
              <span className="countdown-chip">⏱ 促销剩余 {countdown}</span>
            </div>
          )}
          <div style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a', marginBottom: 10, lineHeight: 1.4 }}>
            {product.name}
          </div>
          <StockBadge />
        </div>

        {/* Description */}
        {product.description && (
          <div style={{ background: '#fff', padding: '16px', marginTop: 8 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>商品详情</div>
            <div style={{ height: 1, background: '#f0f0f0', marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.85 }}>{product.description}</div>
          </div>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div style={{ background: '#fff', padding: '16px', marginTop: 8 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>相关商品</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="tap-feedback"
                  style={{
                    flexShrink: 0, width: 112, cursor: 'pointer',
                    borderRadius: 10, overflow: 'hidden',
                    border: '1px solid #f0f0f0', background: '#fafafa',
                  }}
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/110?text=N/A' }}
                  />
                  <div style={{ padding: '7px 8px 8px' }}>
                    <div style={{ fontSize: 12, color: '#444', lineHeight: 1.35, marginBottom: 4,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>¥{p.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related posts (种草) */}
        {relatedPosts.length > 0 && (
          <div style={{ background: '#fff', padding: '16px', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="section-title">相关种草</div>
              {relatedPostsTotal > 3 && (
                <span
                  onClick={() => navigate(`/community?product_id=${id}`)}
                  style={{ fontSize: 12, color: '#888', cursor: 'pointer' }}
                >
                  全部 {relatedPostsTotal} 篇 &gt;
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {relatedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/posts/${post.id}`)}
                  style={{
                    flexShrink: 0, width: 120, borderRadius: 12, overflow: 'hidden',
                    background: '#f9f9f9', cursor: 'pointer',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  }}
                >
                  {post.image_urls?.[0] ? (
                    <img
                      src={post.image_urls[0]}
                      alt={post.title}
                      style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x90?text=No+Image' }}
                    />
                  ) : (
                    <div style={{ height: 90, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📝</div>
                  )}
                  <div style={{ padding: '6px 8px 8px' }}>
                    <div style={{
                      fontSize: 12, color: '#333', lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {post.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div style={{ background: '#fff', padding: '16px', marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="section-title">
              用户评价 {reviewStats && reviewStats.total > 0 ? `(${reviewStats.total})` : ''}
            </div>
            {reviewStats && reviewStats.total > 3 && (
              <span style={{ fontSize: 12, color: '#888', cursor: 'pointer' }}>查看全部 &gt;</span>
            )}
          </div>

          {/* Rating summary */}
          {reviewStats && reviewStats.total > 0 && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 14, padding: '12px 14px', background: '#fafafa', borderRadius: 12 }}>
              <div style={{ textAlign: 'center', minWidth: 56 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#faad14', lineHeight: 1, marginBottom: 4 }}>
                  {reviewStats.avg_rating.toFixed(1)}
                </div>
                <Stars value={reviewStats.avg_rating} size={12} />
              </div>
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar
                    key={star}
                    label={`${star}★`}
                    count={reviewStats.distribution[star - 1]}
                    total={reviewStats.total}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Review list */}
          {reviews.length > 0 ? reviews.map((r, idx) => (
            <div
              key={r.id}
              className="review-item"
              style={{ borderTop: idx > 0 ? '1px solid #f5f5f5' : undefined, paddingTop: idx > 0 ? 12 : 0, marginTop: idx > 0 ? 12 : 0, animationDelay: `${idx * 0.06}s` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#F0EDE8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#777', fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {r.user?.phone ? r.user.phone.slice(0, 1).toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
                    {r.user?.phone
                      ? r.user.phone.replace(/(.{3}).+(.{4})$/, '$1****$2')
                      : '匿名'}
                  </div>
                  <Stars value={r.rating} size={11} />
                </div>
                <span style={{ fontSize: 11, color: '#ccc' }}>
                  {new Date(r.created_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                </span>
              </div>
              {r.content && (
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.65, paddingLeft: 42 }}>{r.content}</div>
              )}
            </div>
          )) : (
            <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '16px 0' }}>暂无评价，来写第一条吧</div>
          )}

          {/* Review form */}
          {token && canReview && (
            <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16, animation: 'page-enter 0.24s ease both' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12 }}>写评价</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>评分</div>
                <Stars value={rating} size={28} interactive onChange={setRating} />
              </div>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="分享你的使用体验…"
                maxLength={500}
                rows={3}
                style={{
                  width: '100%', border: '1.5px solid #f0f0f0', borderRadius: 12,
                  padding: '10px 12px', fontSize: 14, color: '#333', resize: 'none',
                  outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                  background: '#fafafa', transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#aaa' }}
                onBlur={(e) => { e.target.style.borderColor = '#f0f0f0' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 12, color: '#ccc' }}>{reviewContent.length}/500</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={submitReview}
                  disabled={submittingReview || rating === 0}
                  style={{ opacity: (submittingReview || rating === 0) ? 0.6 : 1 }}
                >
                  {submittingReview
                    ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> 提交中…</>
                    : '提交评价'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky-bottom-bar" style={{ flexDirection: 'column', gap: 8, padding: '10px 16px calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Qty row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <span style={{ fontSize: 12, color: '#999' }}>数量</span>
          <QtyStepper value={qty} min={1} max={product.stock || 1} onChange={setQty} />
        </div>
        {/* Button row */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            className="btn btn-outline btn-md"
            onClick={addToCart}
            disabled={!inStock || addingCart}
            style={{ flex: 1, opacity: !inStock ? 0.5 : 1, minWidth: 0 }}
          >
            {addingCart
              ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#01c2c3' }} />
              : <><ShoppingCartOutlined /> 加购物车</>}
          </button>
          <button
            className="btn btn-orange btn-md"
            onClick={buyNow}
            disabled={!inStock || buyingNow}
            style={{ flex: 1, opacity: !inStock ? 0.5 : 1, minWidth: 0 }}
          >
            {buyingNow
              ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              : <><ThunderboltOutlined /> 立即购买</>}
          </button>
        </div>
      </div>
    </div>
  )
}

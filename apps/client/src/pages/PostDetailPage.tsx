import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { HeartOutlined, HeartFilled, ShoppingOutlined } from '@ant-design/icons'
import { message } from 'antd'
import api from '../api/axios'
import NavBar from '../components/NavBar'
import { useAuthStore } from '../store/authStore'

interface PostProduct {
  id: number
  name: string
  price: number
  image_url: string
}

interface Post {
  id: number
  user_id: number
  title: string
  content: string
  image_urls: string[]
  like_count: number
  created_at: string
  author_name?: string
  is_liked: boolean
  products?: PostProduct[]
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [heartAnim, setHeartAnim] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    setLoading(true)
    api.get(`/posts/${id}`)
      .then((r) => setPost(r.data.data))
      .catch(() => message.error('帖子不存在'))
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = useCallback(async () => {
    if (!token) { message.info('请先登录'); return }
    if (!post || liking) return
    setLiking(true)
    try {
      const res = await api.post(`/posts/${post.id}/like`)
      const { is_liked, like_count } = res.data.data
      setPost((p) => p ? { ...p, is_liked, like_count } : p)
      setHeartAnim(true)
      setTimeout(() => setHeartAnim(false), 300)
    } catch {
      message.error('操作失败')
    } finally {
      setLiking(false)
    }
  }, [post, token, liking])

  if (loading) {
    return (
      <div className="app-shell">
        <NavBar title="帖子详情" back />
        <div className="loading-center"><div className="spinner-lg" /></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="app-shell">
        <NavBar title="帖子详情" back />
        <div className="empty-state">
          <span className="empty-state-icon">😕</span>
          <span className="empty-state-text">帖子不存在或已被删除</span>
        </div>
      </div>
    )
  }

  const HeartIcon = post.is_liked ? HeartFilled : HeartOutlined

  return (
    <div className="app-shell">
      <NavBar title="种草详情" back />

      <div className="page-content-no-tab" style={{ paddingBottom: 80 }}>
        {/* Image gallery */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div style={{ position: 'relative', background: '#000' }}>
            <img
              src={post.image_urls[imgIndex]}
              alt={post.title}
              style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image' }}
            />
            {post.image_urls.length > 1 && (
              <>
                {/* Thumbnails */}
                <div style={{
                  display: 'flex', gap: 6, padding: '8px 12px',
                  overflowX: 'auto', background: '#111',
                  scrollbarWidth: 'none',
                }}>
                  {post.image_urls.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setImgIndex(i)}
                      style={{
                        flexShrink: 0, width: 52, height: 52, borderRadius: 8,
                        overflow: 'hidden', cursor: 'pointer',
                        border: `2px solid ${i === imgIndex ? '#01c2c3' : 'transparent'}`,
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
                {/* Counter */}
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(0,0,0,0.5)', color: '#fff',
                  fontSize: 12, padding: '3px 8px', borderRadius: 12,
                }}>
                  {imgIndex + 1}/{post.image_urls.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* Author & meta */}
        <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #01c2c3, #00a8a9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
          }}>
            {(post.author_name || '用')[0]}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>
              {post.author_name || `用户${post.user_id}`}
            </div>
            <div style={{ fontSize: 12, color: '#bbb' }}>
              {new Date(post.created_at).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: '12px 16px 4px', fontSize: 18, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4 }}>
          {post.title}
        </div>

        {/* Content */}
        <div style={{ padding: '4px 16px 16px', fontSize: 14, color: '#555', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>

        {/* Related products */}
        {post.products && post.products.length > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#999', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShoppingOutlined />
              相关商品
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {post.products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  style={{
                    flexShrink: 0, width: 120, background: '#f9f9f9',
                    borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                    transition: 'transform 0.15s',
                  }}
                  onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x90?text=No+Image' }}
                  />
                  <div style={{ padding: '6px 8px 8px' }}>
                    <div style={{ fontSize: 12, color: '#333', lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      marginBottom: 4 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ff4d4f' }}>¥{p.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Like bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 540,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '10px 20px calc(10px + env(safe-area-inset-bottom,0px))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 200,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 13, color: '#bbb' }}>
          {post.like_count > 0 ? `${post.like_count} 人喜欢` : '成为第一个点赞的人'}
        </div>
        <button
          onClick={handleLike}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: post.is_liked ? '#fff0f0' : '#f5f5f5',
            border: 'none', borderRadius: 22,
            padding: '8px 20px', cursor: 'pointer',
            fontSize: 15, color: post.is_liked ? '#ff4d4f' : '#666',
            fontFamily: 'inherit', fontWeight: 600,
            transition: 'background 0.18s, color 0.18s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <HeartIcon
            style={{
              fontSize: 18,
              animation: heartAnim ? 'heart-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
            }}
          />
          {post.is_liked ? '已喜欢' : '喜欢'}
        </button>
      </div>
    </div>
  )
}

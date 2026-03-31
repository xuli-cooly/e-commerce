import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EditOutlined } from '@ant-design/icons'
import api from '../api/axios'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 20

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
  status: string
  like_count: number
  created_at: string
  author_name?: string
  is_liked?: boolean
  products?: PostProduct[]
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonPost() {
  return (
    <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #EBEBEB' }}>
      <div className="skeleton-img" style={{ height: 180 }} />
      <div style={{ padding: '10px 12px 14px' }}>
        <div className="skeleton-line" style={{ width: '85%', marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: '55%' }} />
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const cover = post.image_urls?.[0]
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 8, overflow: 'hidden',
        border: '1px solid #EBEBEB', cursor: 'pointer',
        transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        WebkitTapHighlightColor: 'transparent',
        marginBottom: 10,
      }}
      onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
      onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {cover && (
        <div style={{ background: '#f0f0f0', aspectRatio: '3/4', overflow: 'hidden' }}>
          <img
            src={cover}
            alt={post.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.25s' }}
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1' }}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image'; (e.target as HTMLImageElement).style.opacity = '1' }}
          />
        </div>
      )}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#222', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 8 }}>
          {post.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: '#999' }}>
            {post.author_name || `用户${post.user_id}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#bbb' }}>
            <span>❤️</span>
            <span>{post.like_count}</span>
            {post.products && post.products.length > 0 && (
              <span style={{ marginLeft: 6, color: '#888', fontWeight: 500 }}>
                🛍 {post.products.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const [sort, setSort] = useState<'latest' | 'hot'>('latest')
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productIDFilter = searchParams.get('product_id')
  const token = useAuthStore((s) => s.token)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const hasMore = posts.length < total
  const loadMoreRef = useRef({ hasMore: false, loading: false, page: 1 })
  loadMoreRef.current = { hasMore, loading, page }

  const fetchPage = useCallback(async (pageNum: number, currentSort: string, replace: boolean) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { sort: currentSort, page: pageNum, size: PAGE_SIZE }
      if (productIDFilter) params.product_id = productIDFilter
      const res = await api.get('/posts', { params })
      const { list = [], total: t = 0 } = res.data.data
      setTotal(t)
      setPosts((prev) => replace ? list : [...prev, ...list])
      setPage(pageNum)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [productIDFilter])

  useEffect(() => {
    setInitialLoading(true)
    setPosts([])
    setPage(1)
    setTotal(0)
    fetchPage(1, sort, true)
  }, [sort, productIDFilter]) // eslint-disable-line

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return
      const { hasMore: hm, loading: ld, page: pg } = loadMoreRef.current
      if (hm && !ld) fetchPage(pg + 1, sort, false)
    }, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage, sort, posts.length])

  return (
    <div className="app-shell">
      <NavBar
        title={productIDFilter ? '相关种草' : '社区'}
        back={!!productIDFilter}
      />

      {/* Sort tabs */}
      {!productIDFilter && (
        <div style={{
          display: 'flex', background: '#FAF8F5',
          borderBottom: '1px solid #EBEBEB', flexShrink: 0,
        }}>
          {(['latest', 'hot'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                flex: 1, border: 'none', background: 'none',
                padding: '14px 0 11px', fontSize: 14,
                fontWeight: sort === s ? 700 : 400,
                color: sort === s ? '#1a1a1a' : '#bbb',
                cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
                transition: 'color 0.2s',
              }}
            >
              {s === 'latest' ? '最新' : '热门'}
              {sort === s && (
                <span style={{
                  position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 24, height: 3, background: '#1a1a1a', borderRadius: '2px 2px 0 0',
                }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 12px', paddingBottom: 'calc(60px + env(safe-area-inset-bottom,0px) + 12px)' }}>
        {initialLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[...Array(6)].map((_, i) => <SkeletonPost key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📝</span>
            <span className="empty-state-text">
              {productIDFilter ? '暂无相关种草，快来第一个发布吧' : '暂无内容'}
            </span>
            {token && (
              <button
                className="btn btn-primary btn-md"
                style={{ marginTop: 8 }}
                onClick={() => navigate('/posts/create')}
              >
                去发布
              </button>
            )}
          </div>
        ) : (
          <div style={{ columns: 2, columnGap: 10 }}>
            {posts.map((post) => (
              <div key={post.id} style={{ breakInside: 'avoid', display: 'block' }}>
                <PostCard post={post} onClick={() => navigate(`/posts/${post.id}`)} />
              </div>
            ))}
          </div>
        )}

        {!initialLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
            {loading && !initialLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bbb', fontSize: 13 }}>
                <span className="spinner" />加载中…
              </div>
            )}
            {!loading && !hasMore && posts.length > 0 && (
              <div style={{ fontSize: 12, color: '#ccc' }}>已经到底了</div>
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </div>
        )}
      </div>

      {/* FAB — create post */}
      {token && !productIDFilter && (
        <button
          onClick={() => navigate('/posts/create')}
          style={{
            position: 'fixed',
            bottom: 'calc(60px + env(safe-area-inset-bottom,0px) + 16px)',
            right: 'max(16px, calc(50vw - 270px + 16px))',
            width: 52, height: 52,
            borderRadius: '50%',
            background: '#1a1a1a',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22,
            zIndex: 150,
            transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <EditOutlined />
        </button>
      )}

      <BottomNav />
    </div>
  )
}

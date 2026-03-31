import { useState, useEffect, useRef, useCallback } from 'react'
import { SearchOutlined, FireOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import Masonry from 'react-masonry-css'
import api from '../api/axios'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

interface Category {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  image_url: string
  price: number
  stock: number
  original_price?: number
}

const PAGE_SIZE = 20
const GAP = 10
const PADDING = 12

// ─── Skeleton card ─────────────────────────────────────────────────────────────
const SKELETON_HEIGHTS = [120, 150, 130, 160, 140, 125, 155, 145]

function SkeletonCard({ index }: { index: number }) {
  const h = SKELETON_HEIGHTS[index % SKELETON_HEIGHTS.length]
  return (
    <div className="product-card skeleton-card" style={{ marginBottom: GAP }}>
      <div className="skeleton-img" style={{ height: h }} />
      <div className="product-card-info">
        <div className="skeleton-line" style={{ width: '88%', marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: '60%', marginBottom: 6 }} />
        <div className="skeleton-line" style={{ width: '40%', height: 13 }} />
      </div>
    </div>
  )
}

// ─── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const showOriginal = product.original_price != null && product.original_price > product.price
  const lowStock = product.stock > 0 && product.stock <= 10
  const outOfStock = product.stock === 0

  return (
    <div className="product-card" style={{ marginBottom: GAP }} onClick={onClick}>
      <div style={{ position: 'relative', background: '#f0f0f0' }}>
        <img
          className="product-card-img"
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          style={{ opacity: 0, transition: 'opacity 0.25s ease' }}
          onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1' }}
          onError={(e) => {
            const img = e.target as HTMLImageElement
            img.src = 'https://placehold.co/300x225?text=No+Image'
            img.style.opacity = '1'
          }}
        />
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>已售罄</span>
          </div>
        )}
        {showOriginal && !outOfStock && (
          <span style={{
            position: 'absolute', top: 6, left: 6,
            background: 'linear-gradient(90deg,#ff4d4f,#ff7875)',
            color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '2px 5px', borderRadius: 4,
          }}>折扣</span>
        )}
      </div>
      <div className="product-card-info">
        <div className="product-card-name">{product.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
          <div className="product-card-price">{product.price.toFixed(2)}</div>
          {showOriginal && (
            <span style={{ fontSize: 11, color: '#bbb', textDecoration: 'line-through' }}>
              ¥{product.original_price!.toFixed(2)}
            </span>
          )}
        </div>
        {lowStock && (
          <div style={{ fontSize: 11, color: '#fa8c16', marginTop: 2, fontWeight: 500 }}>
            仅剩 {product.stock} 件
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Waterfall grid (react-masonry-css) ───────────────────────────────────────
function WaterfallGrid({
  products,
  initialLoading,
  hasMore,
  loadingMore,
  sentinelRef,
  onClickItem,
}: {
  products: Product[]
  initialLoading: boolean
  hasMore: boolean
  loadingMore: boolean
  sentinelRef: React.RefObject<HTMLDivElement>
  onClickItem: (id: number) => void
}) {
  return (
    <div style={{ padding: `${GAP}px ${PADDING}px`, paddingBottom: 'calc(60px + env(safe-area-inset-bottom,0px) + 12px)' }}>
      <Masonry
        breakpointCols={2}
        className="masonry-grid"
        columnClassName="masonry-col"
      >
        {initialLoading
          ? new Array(8).fill(0).map((_, i) => <SkeletonCard key={i} index={i} />)
          : products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onClickItem(p.id)} />
            ))
        }
      </Masonry>

      {!initialLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
          {loadingMore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bbb', fontSize: 13 }}>
              <span className="spinner" />加载中…
            </div>
          )}
          {!loadingMore && hasMore && (
            <div style={{ fontSize: 13, color: '#ccc' }}>上滑加载更多</div>
          )}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
      )}
    </div>
  )
}

// ─── Category tab bar ──────────────────────────────────────────────────────────
function CategoryBar({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[]
  selected: number | null
  onSelect: (id: number | null) => void
}) {
  const all = [{ id: 0, name: '全部' }, ...categories]
  const barRef = useRef<HTMLDivElement>(null)
  const activeIndex = selected === null ? 0 : all.findIndex((c) => c.id === selected)

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!barRef.current) return
    const bar = barRef.current
    const activeEl = bar.children[activeIndex] as HTMLElement
    if (!activeEl) return
    const barLeft = bar.scrollLeft
    const barRight = barLeft + bar.clientWidth
    const elLeft = activeEl.offsetLeft
    const elRight = elLeft + activeEl.offsetWidth
    if (elLeft < barLeft + 12) {
      bar.scrollTo({ left: elLeft - 12, behavior: 'smooth' })
    } else if (elRight > barRight - 12) {
      bar.scrollTo({ left: elRight - bar.clientWidth + 12, behavior: 'smooth' })
    }
  }, [activeIndex])

  return (
    <div
      ref={barRef}
      style={{
        display: 'flex',
        overflowX: 'auto',
        gap: 0,
        padding: '0 12px',
        background: '#FAF8F5',
        borderBottom: '1px solid #EBEBEB',
        scrollbarWidth: 'none',
        flexShrink: 0,
      }}
    >
      {all.map((cat) => {
        const active = cat.id === 0 ? selected === null : selected === cat.id
        return (
          <div
            key={cat.id}
            onClick={() => onSelect(cat.id === 0 ? null : cat.id)}
            style={{
              flexShrink: 0,
              padding: '10px 14px',
              borderRadius: 0,
              fontSize: 13,
              fontWeight: active ? 700 : 400,
              background: 'transparent',
              color: active ? '#1a1a1a' : '#999',
              cursor: 'pointer',
              transition: 'color 0.18s',
              whiteSpace: 'nowrap',
              borderBottom: active ? '2px solid #1a1a1a' : '2px solid transparent',
            }}
          >
            {cat.name}
          </div>
        )
      })}
    </div>
  )
}

// ─── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
}: {
  value: string
  onChange: (v: string) => void
  onSearch: () => void
  onClear: () => void
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      padding: '8px 12px',
      position: 'sticky', top: 52, zIndex: 50,
      background: '#f5f5f5',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', borderRadius: 22,
        padding: '0 14px', height: 40,
        boxShadow: focused ? '0 0 0 2px rgba(0,0,0,0.1), 0 2px 10px rgba(0,0,0,0.07)' : '0 2px 10px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.2s',
      }}>
        <SearchOutlined style={{ color: '#bbb', fontSize: 15, flexShrink: 0 }} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch() }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="搜索你想要的商品..."
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: 14, color: '#333', outline: 'none', fontFamily: 'inherit',
          }}
        />
        {value && (
          <CloseOutlined
            style={{ color: '#ccc', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
            onClick={onClear}
          />
        )}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const navigate = useNavigate()
  const sentinelRef = useRef<HTMLDivElement>(null)

  // swipe gesture
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const hasMore = products.length < total
  const isLoadingMore = loading && !initialLoading

  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(r.data.data || []))
      .catch(() => {})
  }, [])

  const fetchPage = useCallback(async (
    pageNum: number, keyword: string, catID: number | null, replace: boolean,
  ) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { search: keyword, page: pageNum, size: PAGE_SIZE }
      if (catID !== null) params.category_id = catID
      const res = await api.get('/products', { params })
      const { list = [], total: t = 0 } = res.data.data
      setTotal(t)
      setProducts((prev) => (replace ? list : [...prev, ...list]))
      setPage(pageNum)
    } catch {
      message.error('加载商品失败')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => { fetchPage(1, '', null, true) }, []) // eslint-disable-line

  const switchCategory = useCallback((catID: number | null) => {
    setSelectedCategory(catID)
    setProducts([])
    setPage(1)
    setTotal(0)
    setInitialLoading(true)
    fetchPage(1, search, catID, true)
  }, [fetchPage, search])

  const doSearch = useCallback((keyword: string) => {
    setSearch(keyword)
    setProducts([])
    setPage(1)
    setTotal(0)
    setInitialLoading(true)
    fetchPage(1, keyword, selectedCategory, true)
  }, [fetchPage, selectedCategory])

  // ── IntersectionObserver for infinite scroll ──────────────────────────────
  const loadMoreRef = useRef({ hasMore: false, loading: false, page: 1, search: '', category: null as number | null })
  loadMoreRef.current = { hasMore, loading, page, search, category: selectedCategory }

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return
      const { hasMore: hm, loading: ld, page: pg, search: kw, category: cat } = loadMoreRef.current
      if (hm && !ld) fetchPage(pg + 1, kw, cat, false)
    }, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage, products.length])

  // ── Swipe to switch category ───────────────────────────────────────────────
  const allCategoryIds: (number | null)[] = [null, ...categories.map((c) => c.id)]

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // only horizontal swipes with enough magnitude and not too vertical
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return
    const currentIdx = allCategoryIds.indexOf(selectedCategory)
    if (dx < 0) {
      // swipe left → next category
      const next = allCategoryIds[currentIdx + 1]
      if (next !== undefined) switchCategory(next)
    } else {
      // swipe right → prev category
      const prev = allCategoryIds[currentIdx - 1]
      if (prev !== undefined) switchCategory(prev)
    }
  }, [allCategoryIds, selectedCategory, switchCategory])

  return (
    <div className="app-shell">
      <NavBar
        title="发现好物"
        right={<FireOutlined style={{ fontSize: 18, opacity: 0.85 }} />}
      />

      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSearch={() => doSearch(searchInput)}
        onClear={() => { setSearchInput(''); doSearch('') }}
      />

      {categories.length > 0 && (
        <CategoryBar
          categories={categories}
          selected={selectedCategory}
          onSelect={switchCategory}
        />
      )}

      {/* Content area — swipe gesture target */}
      <div
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {!initialLoading && products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <span className="empty-state-text">没有找到相关商品</span>
          </div>
        ) : (
          <WaterfallGrid
            products={products}
            initialLoading={initialLoading}
            hasMore={hasMore}
            loadingMore={isLoadingMore}
            sentinelRef={sentinelRef}
            onClickItem={(id) => navigate(`/products/${id}`)}
          />
        )}
      </div>

      <BottomNav />
    </div>
  )
}

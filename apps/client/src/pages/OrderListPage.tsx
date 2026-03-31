import { useState, useEffect } from 'react'
import { message } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import api from '../api/axios'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

const statusConfig: Record<string, { cls: string; label: string; stripe: string }> = {
  PENDING:  { cls: 'status-badge-orange', label: '待支付', stripe: '#faad14' },
  PAID:     { cls: 'status-badge-green',  label: '已支付', stripe: '#52c41a' },
  SHIPPED:  { cls: 'status-badge-blue',   label: '已发货', stripe: '#1677ff' },
  REFUNDED: { cls: 'status-badge-red',    label: '已退款', stripe: '#ff4d4f' },
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const PAGE_SIZE = 20
  const hasMore = orders.length < total

  const fetchPage = async (p: number, replace: boolean) => {
    setLoading(true)
    try {
      const res = await api.get('/orders', { params: { page: p, size: PAGE_SIZE } })
      const { list = [], total: t = 0 } = res.data.data
      setTotal(t)
      setOrders((prev) => (replace ? list : [...prev, ...list]))
      setPage(p)
    } catch {
      message.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPage(1, true) }, []) // eslint-disable-line

  return (
    <div className="app-shell">
      <NavBar title="我的订单" />

      <div className="page-content">
        {loading && orders.length === 0 ? (
          <div className="loading-center">
            <div className="spinner-lg" />
            <span style={{ fontSize: 13, color: '#bbb' }}>加载中…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon"><FileTextOutlined /></span>
            <span className="empty-state-text">暂无订单记录</span>
          </div>
        ) : (
          <div style={{ padding: '10px 0 4px', animation: 'page-enter 0.28s ease both' }}>
            {orders.map((order, idx) => {
              const cfg = statusConfig[order.status] ?? { cls: 'status-badge-gray', label: order.status, stripe: '#d9d9d9' }
              return (
                <div
                  key={order.id}
                  className="order-card"
                  style={{
                    '--order-color': cfg.stripe,
                    animationDelay: `${idx * 0.04}s`,
                  } as React.CSSProperties}
                >
                  <div className="order-card-header">
                    <span style={{ fontSize: 13, color: '#888' }}>
                      订单号 <span style={{ color: '#555', fontWeight: 600 }}>#{order.id}</span>
                    </span>
                    <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>
                  </div>

                  {/* Order items preview */}
                  {order.items && order.items.length > 0 && (
                    <div style={{ padding: '8px 14px 0 18px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                      {order.items.slice(0, 4).map((item: any) => (
                        <img
                          key={item.id}
                          src={item.product?.image_url}
                          alt={item.product?.name}
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#f0f0f0' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48?text=?' }}
                        />
                      ))}
                      {order.items.length > 4 && (
                        <div style={{
                          width: 48, height: 48, borderRadius: 8, background: '#f5f5f5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, color: '#999', flexShrink: 0,
                        }}>
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="order-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 12, color: '#bbb' }}>
                        {new Date(order.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontSize: 13, color: '#555' }}>
                        实付&nbsp;
                        <span style={{ color: '#ff4d4f', fontWeight: 800, fontSize: 18 }}>
                          ¥{order.total_amount?.toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load more */}
            {hasMore && (
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 4px', gap: 6 }}
              >
                {loading
                  ? <><span className="spinner" /><span style={{ fontSize: 13, color: '#bbb' }}>加载中…</span></>
                  : (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => fetchPage(page + 1, false)}
                      style={{ borderRadius: 20, fontSize: 13, color: '#999' }}
                    >
                      加载更多
                    </button>
                  )
                }
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

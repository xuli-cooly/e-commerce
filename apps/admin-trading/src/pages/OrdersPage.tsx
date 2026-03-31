import { useState, useEffect } from 'react'
import { Table, Tag, Select, message, Typography } from 'antd'
import api from '../api/axios'

const STATUS_OPTIONS = [
  { value: 'PENDING',  label: '待支付',  color: 'orange' },
  { value: 'PAID',     label: '已支付',  color: 'green' },
  { value: 'SHIPPED',  label: '已发货',  color: 'blue' },
  { value: 'REFUNDED', label: '已退款',  color: 'red' },
]

const statusLabel = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label]))
const statusColor = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.color]))

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchOrders = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get('/admin/orders', { params: { page: p, size: 20 } })
      setOrders(res.data.data.list || [])
      setTotal(res.data.data.total || 0)
    } catch {
      message.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [page])

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status })
      message.success('状态已更新')
      fetchOrders()
    } catch (err: any) {
      message.error(err.response?.data?.message || '更新失败')
    }
  }

  const columns = [
    { title: '订单号', dataIndex: 'id', width: 80 },
    {
      title: '用户手机',
      render: (_: any, r: any) => r.user?.phone ?? '-',
    },
    {
      title: '金额',
      render: (_: any, r: any) => (
        <Typography.Text type="danger">¥{r.total_amount?.toFixed(2)}</Typography.Text>
      ),
    },
    {
      title: '状态',
      render: (_: any, r: any) => <Tag color={statusColor[r.status]}>{statusLabel[r.status]}</Tag>,
    },
    {
      title: '下单时间',
      render: (_: any, r: any) => new Date(r.created_at).toLocaleString('zh-CN'),
    },
    {
      title: '修改状态',
      width: 150,
      render: (_: any, r: any) => (
        <Select
          value={r.status}
          size="small"
          style={{ width: 120 }}
          onChange={(val) => updateStatus(r.id, val)}
          options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
      ),
    },
  ]

  return (
    <Table
      dataSource={orders}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ total, current: page, pageSize: 20, onChange: setPage }}
    />
  )
}

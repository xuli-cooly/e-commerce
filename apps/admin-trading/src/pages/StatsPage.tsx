import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Spin, message } from 'antd'
import {
  DollarOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import api from '../api/axios'

interface Stats {
  total_revenue: number
  total_orders: number
  paid_orders: number
  total_products: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data.data))
      .catch(() => message.error('加载统计数据失败'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spin style={{ display: 'block', marginTop: 60 }} />

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="总销售额"
            value={stats?.total_revenue ?? 0}
            precision={2}
            prefix={<DollarOutlined />}
            suffix="元"
            valueStyle={{ color: '#01c2c3' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="总订单数"
            value={stats?.total_orders ?? 0}
            prefix={<ShoppingOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="已支付订单"
            value={stats?.paid_orders ?? 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="商品总数"
            value={stats?.total_products ?? 0}
            prefix={<AppstoreOutlined />}
          />
        </Card>
      </Col>
    </Row>
  )
}

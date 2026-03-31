import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch, Select, message } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import DatePicker from 'antd/es/date-picker'
import dayjs, { Dayjs } from 'dayjs'
import api from '../api/axios'

interface Category {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  price: number
  original_price?: number
  promotion_end_at?: string
  stock: number
  is_active: boolean
  image_url: string
  description: string
  category_id?: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form] = Form.useForm()

  const fetchProducts = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get('/admin/products', { params: { page: p, size: 20 } })
      setProducts(res.data.data.list || [])
      setTotal(res.data.data.total || 0)
    } catch {
      message.error('加载商品失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories')
      setCategories(res.data.data || [])
    } catch {
      // categories not critical
    }
  }

  useEffect(() => { fetchCategories() }, [])   // eslint-disable-line
  useEffect(() => { fetchProducts() }, [page])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldValue('is_active', true)
    setModalOpen(true)
  }

  const openEdit = (record: Product) => {
    setEditing(record)
    form.setFieldsValue({
      ...record,
      promotion_end_at: record.promotion_end_at ? dayjs(record.promotion_end_at) : null,
    })
    setModalOpen(true)
  }

  const onSave = async () => {
    const values = await form.validateFields()
    // Serialize promotion_end_at Dayjs → ISO string
    const payload = {
      ...values,
      promotion_end_at: values.promotion_end_at
        ? (values.promotion_end_at as Dayjs).toISOString()
        : null,
      original_price: values.original_price || null,
      category_id: values.category_id || null,
    }
    try {
      if (editing) {
        await api.put(`/admin/products/${editing.id}`, payload)
        message.success('商品已更新')
      } else {
        await api.post('/admin/products', payload)
        message.success('商品已创建')
      }
      setModalOpen(false)
      fetchProducts()
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败')
    }
  }


  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '图片', dataIndex: 'image_url', width: 80,
      render: (url: string) => (
        <img src={url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48?text=N/A' }} />
      ),
    },
    { title: '商品名称', dataIndex: 'name' },
    {
      title: '价格', dataIndex: 'price',
      render: (v: number, r: Product) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>¥{v.toFixed(2)}</span>
          {r.original_price ? (
            <span style={{ fontSize: 12, color: '#bbb', textDecoration: 'line-through' }}>¥{r.original_price.toFixed(2)}</span>
          ) : null}
        </Space>
      ),
    },
    { title: '库存', dataIndex: 'stock' },
    {
      title: '分类', dataIndex: 'category_id',
      render: (v: number) => {
        const cat = categories.find((c) => c.id === v)
        return cat ? <Tag color="blue">{cat.name}</Tag> : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: '状态', dataIndex: 'is_active',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '上架' : '下架'}</Tag>,
    },
    {
      title: '操作', width: 100,
      render: (_: any, r: Product) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)}>编辑</Button>
      ),
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增商品</Button>
      </div>

      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ total, current: page, pageSize: 20, onChange: setPage }}
      />

      <Modal
        title={editing ? '编辑商品' : '新增商品'}
        open={modalOpen}
        onOk={onSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="图片URL" name="image_url">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="分类" name="category_id">
            <Select
              allowClear
              placeholder="选择分类（可选）"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item label="售价（元）" name="price" rules={[{ required: true, message: '请输入价格' }]} style={{ flex: 1 }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="原价/划线价（元，可选）" name="original_price" style={{ flex: 1 }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="留空则不显示" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item label="库存" name="stock" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="促销截止时间（可选）" name="promotion_end_at" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="不设置则永久有效" />
            </Form.Item>
          </Space>
          <Form.Item label="上架状态" name="is_active" valuePropName="checked">
            <Switch checkedChildren="上架" unCheckedChildren="下架" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

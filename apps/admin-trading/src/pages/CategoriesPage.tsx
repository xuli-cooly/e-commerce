import { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Modal, Form, message, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../api/axios'

interface Category {
  id: number
  name: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form] = Form.useForm()

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/categories')
      setCategories(res.data.data || [])
    } catch {
      message.error('加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: Category) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const onSave = async () => {
    const values = await form.validateFields()
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, { name: values.name })
        message.success('分类已更新')
      } else {
        await api.post('/admin/categories', { name: values.name })
        message.success('分类已创建')
      }
      setModalOpen(false)
      fetchCategories()
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/categories/${id}`)
      message.success('分类已删除')
      fetchCategories()
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败（请先移除该分类下的商品）')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '分类名称',
      dataIndex: 'name',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, r: Category) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(r)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该分类？"
            description="删除后该分类下商品将归为「全部」"
            onConfirm={() => handleDelete(r.id)}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
          >
            <Button size="small" icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增分类
        </Button>
      </div>

      <Table
        dataSource={categories}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        style={{ maxWidth: 600 }}
      />

      <Modal
        title={editing ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onOk={onSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="例如：手机、服装、食品" maxLength={50} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

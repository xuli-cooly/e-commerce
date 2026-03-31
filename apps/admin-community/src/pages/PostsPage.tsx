import { useEffect, useState } from 'react'
import {
  Table, Tag, Select, Space, Button, Modal, Popconfirm, Image,
  Typography, Input, message, Badge,
} from 'antd'
import { SearchOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import api from '../api/axios'

const { Text } = Typography

interface Post {
  id: number
  title: string
  content: string
  image_urls: string[]
  status: 'active' | 'removed'
  like_count: number
  user_id: number
  author_name: string
  created_at: string
}

interface ListRes {
  list: Post[]
  total: number
}

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '已发布', value: 'active' },
  { label: '已下架', value: 'removed' },
]

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, size: pageSize }
      if (status) params.status = status
      if (keyword) params.keyword = keyword
      const res = await api.get<{ data: ListRes }>('/admin/posts', { params })
      setPosts(res.data.data.list ?? [])
      setTotal(res.data.data.total ?? 0)
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取帖子列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [page, status])

  const handleUpdateStatus = async (post: Post, newStatus: 'active' | 'removed') => {
    try {
      await api.patch(`/admin/posts/${post.id}`, { status: newStatus })
      message.success(newStatus === 'removed' ? '已下架' : '已恢复发布')
      fetchPosts()
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败')
    }
  }

  const handleHardDelete = async () => {
    if (!deleteTarget) return
    if (deleteConfirmText !== deleteTarget.title) {
      message.error('请正确输入帖子标题确认删除')
      return
    }
    setDeleting(true)
    try {
      await api.delete(`/admin/posts/${deleteTarget.id}`)
      message.success('帖子已永久删除')
      setDeleteTarget(null)
      setDeleteConfirmText('')
      fetchPosts()
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const columns: ColumnsType<Post> = [
    {
      title: '封面',
      dataIndex: 'image_urls',
      width: 72,
      render: (urls: string[]) =>
        urls?.[0] ? (
          <Image
            src={urls[0]}
            width={56}
            height={56}
            style={{ objectFit: 'cover', borderRadius: 6 }}
            preview={{ mask: false }}
          />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 6,
            background: '#f0f0f0', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#ccc',
          }}>📷</div>
        ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (title: string, record) => (
        <div>
          <Text strong ellipsis style={{ maxWidth: 280, display: 'block' }}>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.content.slice(0, 60)}{record.content.length > 60 ? '…' : ''}
          </Text>
        </div>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author_name',
      width: 100,
      render: (name: string, record) => (
        <div>
          <div>{name || `用户${record.user_id}`}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>ID: {record.user_id}</Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: string) =>
        s === 'active' ? (
          <Badge status="success" text="已发布" />
        ) : (
          <Badge status="error" text="已下架" />
        ),
    },
    {
      title: '点赞',
      dataIndex: 'like_count',
      width: 80,
      sorter: (a, b) => a.like_count - b.like_count,
      render: (n: number) => <Tag color="volcano" style={{ whiteSpace: 'nowrap' }}>❤ {n}</Tag>,
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      width: 140,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          {record.status === 'active' ? (
            <Popconfirm
              title="确认下架该帖子？"
              description="下架后用户端将不可见，但帖子数据保留。"
              onConfirm={() => handleUpdateStatus(record, 'removed')}
              okText="确认下架"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" icon={<StopOutlined />} danger>下架</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="恢复发布该帖子？"
              onConfirm={() => handleUpdateStatus(record, 'active')}
              okText="确认恢复"
              cancelText="取消"
            >
              <Button size="small" icon={<CheckCircleOutlined />} type="primary">恢复</Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              setDeleteTarget(record)
              setDeleteConfirmText('')
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>社区帖子管理</span>
        <div style={{ flex: 1 }} />
        <Input
          placeholder="搜索标题..."
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => { setPage(1); fetchPosts() }}
          allowClear
        />
        <Select
          value={status}
          onChange={(v) => { setStatus(v); setPage(1) }}
          options={STATUS_OPTIONS}
          style={{ width: 120 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={posts}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
          showSizeChanger: false,
        }}
        scroll={{ x: 900 }}
      />

      {/* Hard delete confirmation modal */}
      <Modal
        title="永久删除帖子"
        open={!!deleteTarget}
        onCancel={() => { setDeleteTarget(null); setDeleteConfirmText('') }}
        onOk={handleHardDelete}
        okText="确认永久删除"
        okButtonProps={{ danger: true, loading: deleting, disabled: deleteConfirmText !== deleteTarget?.title }}
        cancelText="取消"
        destroyOnClose
      >
        <p style={{ marginBottom: 16 }}>
          此操作将<strong>永久删除</strong>帖子及其所有点赞记录，无法恢复。
        </p>
        <p style={{ marginBottom: 8 }}>
          请输入帖子标题 <Text code>{deleteTarget?.title}</Text> 确认删除：
        </p>
        <Input
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder="输入帖子标题"
        />
      </Modal>
    </div>
  )
}

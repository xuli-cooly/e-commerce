import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useShellAuthStore } from '../store/authStore'
import api from '../api/axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useShellAuthStore((s) => s.setAuth)

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const res = await api.post('/auth/admin/login', values)
      const { token, userId } = res.data.data
      setAuth(token, userId, 'ADMIN')
      message.success('登录成功')
      navigate('/admin/trading')
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败')
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f0f2f5',
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            <span style={{ color: '#01c2c3' }}>淘好物</span>
          </div>
          <div style={{ color: '#888', fontSize: 14 }}>管理后台</div>
        </div>
        <Form
          onFinish={onFinish}
          layout="vertical"
          initialValues={{ username: 'admin', password: 'Admin@2026#Trading!' }}
        >
          <Form.Item label="账号" name="username" rules={[{ required: true }]}>
            <Input size="large" placeholder="请输入账号" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password size="large" placeholder="请输入密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

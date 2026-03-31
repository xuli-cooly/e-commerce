import { useEffect, useRef } from 'react'
import { Layout, Menu, Button, Avatar, Typography, Tabs, theme } from 'antd'
import {
  ShoppingOutlined,
  OrderedListOutlined,
  UserOutlined,
  TagsOutlined,
  CompassOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useShellAuthStore } from '../store/authStore'
import { getMicroApps } from '../qiankun/apps'
import { setGlobalToken } from '../qiankun/state'
import { useTabStore, TabItem } from '../store/tabStore'

const { Sider, Content, Header } = Layout
const { Text } = Typography

const MENU_ITEMS = [
  { key: '/admin/trading/stats',      icon: <DashboardOutlined />, label: '数据概览', app: 'admin-trading' },
  { key: '/admin/trading/products',   icon: <ShoppingOutlined />,  label: '商品管理', app: 'admin-trading' },
  { key: '/admin/trading/categories', icon: <TagsOutlined />,      label: '分类管理', app: 'admin-trading' },
  { key: '/admin/trading/orders',     icon: <OrderedListOutlined />, label: '订单管理', app: 'admin-trading' },
  { key: '/admin/community/posts',    icon: <CompassOutlined />,   label: '社区管理', app: 'admin-community' },
]

const TITLE_MAP: Record<string, string> = Object.fromEntries(
  MENU_ITEMS.map(({ key, label }) => [key, label])
)

export default function ShellLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token: authToken, clearAuth } = useShellAuthStore()
  const { token: antToken } = theme.useToken()
  const mountedRef = useRef(false)
  const { tabs, activeKey, openTab, closeTab, setActive } = useTabStore()

  useEffect(() => {
    if (!mountedRef.current && authToken) {
      setGlobalToken(authToken)
      mountedRef.current = true
    }
  }, [authToken])

  // Sync URL → tab store
  useEffect(() => {
    const path = location.pathname
    const matched = MENU_ITEMS.find((item) => path.startsWith(item.key))
    if (!matched) return
    const tab: TabItem = {
      key: matched.key,
      title: TITLE_MAP[matched.key],
      path: matched.key,
      fixed: matched.key === '/admin/trading/stats',
    }
    openTab(tab)
  }, [location.pathname])

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const onTabChange = (key: string) => {
    setActive(key)
    navigate(key)
  }

  const onTabEdit = (targetKey: unknown, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const key = targetKey as string
      const wasActive = activeKey === key
      closeTab(key)
      if (wasActive) {
        navigate(useTabStore.getState().activeKey)
      }
    }
  }

  const selectedKey = MENU_ITEMS.find((item) =>
    location.pathname.startsWith(item.key)
  )?.key ?? '/admin/trading/stats'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          background: antToken.colorBgContainer,
          borderRight: `1px solid ${antToken.colorBorderSecondary}`,
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: `1px solid ${antToken.colorBorderSecondary}`,
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#01c2c3' }}>淘好物</span>
          <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>管理后台</span>
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ border: 'none', marginTop: 8 }}
          items={MENU_ITEMS.map(({ key, icon, label }) => ({ key, icon, label }))}
          onClick={({ key }) => navigate(key)}
        />

        {/* Logout at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          borderTop: `1px solid ${antToken.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Avatar size={32} icon={<UserOutlined />} style={{ background: '#01c2c3' }} />
          <Text style={{ flex: 1, fontSize: 13 }}>管理员</Text>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            size="small"
            onClick={handleLogout}
            title="退出登录"
          />
        </div>
      </Sider>

      <Layout style={{ marginLeft: 220 }}>
        <Header style={{
          background: antToken.colorBgContainer,
          borderBottom: `1px solid ${antToken.colorBorderSecondary}`,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          height: 64,
          lineHeight: '64px',
        }}>
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={activeKey}
            onChange={onTabChange}
            onEdit={onTabEdit}
            style={{ marginBottom: 0 }}
            size="small"
            items={tabs.map((t) => ({
              key: t.key,
              label: t.title,
              closable: !t.fixed,
            }))}
          />
        </Header>

        <Content style={{ background: '#f5f6fa', minHeight: 'calc(100vh - 64px)' }}>
          <div id="subapp-trading"   style={{ display: location.pathname.startsWith('/admin/trading')   ? 'block' : 'none' }} />
          <div id="subapp-community" style={{ display: location.pathname.startsWith('/admin/community') ? 'block' : 'none' }} />
        </Content>
      </Layout>
    </Layout>
  )
}

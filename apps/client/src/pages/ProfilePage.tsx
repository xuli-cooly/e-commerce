import { useState } from 'react'
import { message } from 'antd'
import {
  LockOutlined, HeartOutlined, RightOutlined,
  UserOutlined, LogoutOutlined, SafetyOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { userId, clearAuth } = useAuthStore()
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPwdSection, setShowPwdSection] = useState(false)

  const onSetPassword = async () => {
    if (!password || password.length < 8) {
      message.warning('密码长度不能少于8位')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/set-password', { password })
      message.success('密码设置成功')
      setPassword('')
      setShowPwdSection(false)
    } catch (err: any) {
      message.error(err.response?.data?.message || '设置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <NavBar title="我的" />

      <div className="page-content" style={{ animation: 'page-enter 0.28s ease both' }}>

        {/* User hero */}
        <div style={{
          background: '#FAF8F5',
          borderBottom: '1px solid #EBEBEB',
          padding: '28px 20px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: '#EBEBEB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: '2px solid #D8D8D8',
          }}>
            <UserOutlined style={{ fontSize: 28, color: '#666' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
              用户 #{userId}
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>欢迎回来</div>
          </div>
        </div>

        {/* Menu list */}
        <div style={{ margin: '16px 14px 0', background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #EBEBEB' }}>
          {/* Favorites */}
          <div className="profile-item" onClick={() => navigate('/favorites')}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#fff0f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HeartOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#222' }}>我的收藏</span>
            <RightOutlined style={{ color: '#ccc', fontSize: 12 }} />
          </div>

          <div className="divider" style={{ marginLeft: 64 }} />

          {/* Change password */}
          <div className="profile-item" onClick={() => setShowPwdSection((v) => !v)}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SafetyOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#222' }}>修改密码</span>
            <RightOutlined style={{
              color: '#ccc', fontSize: 12,
              transform: showPwdSection ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }} />
          </div>

          {/* Password form - inline expand */}
          {showPwdSection && (
            <div style={{
              padding: '0 16px 16px 64px',
              animation: 'page-enter 0.22s ease both',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f7f7f7',
                borderRadius: 12,
                padding: '0 14px',
                marginBottom: 10,
              }}>
                <LockOutlined style={{ color: '#999' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入新密码（至少8位）"
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    height: 44, fontSize: 14, outline: 'none', color: '#333',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSetPassword() }}
                />
              </div>
              <button
                className="btn btn-primary btn-sm btn-block"
                onClick={onSetPassword}
                disabled={saving}
                style={{ borderRadius: 10, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> 保存中…</> : '保存密码'}
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div style={{ margin: '14px 14px 0' }}>
          <button
            className="btn btn-block btn-lg"
            onClick={handleLogout}
            style={{
              background: '#fff', color: '#ff4d4f', border: '1.5px solid #ffccc7',
              borderRadius: 16, fontSize: 15, fontWeight: 600,
            }}
          >
            <LogoutOutlined />
            退出登录
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

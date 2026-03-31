import { useState, useRef } from 'react'
import { message } from 'antd'
import { MailOutlined, SafetyOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'

type Tab = 'code' | 'password'

function MobileInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  prefix,
  suffix,
  onKeyDown,
}: {
  type?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#f5f7fa', borderRadius: 14, padding: '0 14px',
      height: 52, border: `1.5px solid ${focused ? '#01c2c3' : 'transparent'}`,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: focused ? '0 0 0 3px rgba(1,194,195,0.12)' : 'none',
    }}>
      {prefix && <span style={{ color: focused ? '#01c2c3' : '#bbb', fontSize: 16, transition: 'color 0.2s', flexShrink: 0 }}>{prefix}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        style={{
          flex: 1, border: 'none', background: 'transparent',
          fontSize: 15, color: '#222', outline: 'none', fontFamily: 'inherit',
        }}
      />
      {suffix}
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [tab, setTab] = useState<Tab>('code')

  // Code login
  const [codeEmail, setCodeEmail] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [sending, setSending] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Password login
  const [pwdEmail, setPwdEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const startCountdown = () => {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(timerRef.current!); return 0 }
        return n - 1
      })
    }, 1000)
  }

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(codeEmail)) {
      message.warning('请输入正确的邮箱地址')
      return
    }
    setSending(true)
    try {
      await api.post('/auth/send-code', { email: codeEmail })
      startCountdown()
      message.success('验证码已发送至邮箱')
    } catch (err: any) {
      const status = err.response?.status
      const msg = err.response?.data?.message || '发送失败'
      if (status === 429) { startCountdown(); message.warning(msg) }
      else message.error(msg)
    } finally {
      setSending(false)
    }
  }

  const onCodeLogin = async () => {
    if (!codeEmail || !code) { message.warning('请填写邮箱和验证码'); return }
    setCodeLoading(true)
    try {
      const res = await api.post('/auth/login', { email: codeEmail, code })
      const { token, userId, role } = res.data.data
      setAuth(token, userId, role)
      localStorage.setItem('token', token)
      navigate('/')
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败')
    } finally {
      setCodeLoading(false)
    }
  }

  const onPasswordLogin = async () => {
    if (!pwdEmail || !password) { message.warning('请填写邮箱和密码'); return }
    setPwdLoading(true)
    try {
      const res = await api.post('/auth/password-login', { email: pwdEmail, password })
      const { token, userId, role } = res.data.data
      setAuth(token, userId, role)
      localStorage.setItem('token', token)
      navigate('/')
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="app-shell" style={{ background: 'linear-gradient(160deg, #e0f7f7 0%, #f5f5f5 60%)' }}>
      {/* Brand hero */}
      <div style={{ textAlign: 'center', padding: '72px 24px 40px', animation: 'page-enter 0.4s ease both' }}>
        <div style={{
          width: 84, height: 84, borderRadius: 26,
          background: 'linear-gradient(135deg, #01c2c3, #00a8a9)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          boxShadow: '0 16px 40px rgba(1,194,195,0.35), 0 4px 12px rgba(1,194,195,0.2)',
        }}>
          {/* 淘好物 Logo — SVG shopping bag */}
          <svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 18h18l-2.5 16H16.5L14 18z" fill="white" fillOpacity="0.95"/>
            <path d="M18 18c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="19.5" cy="30" r="1.5" fill="#01c2c3"/>
            <circle cx="26.5" cy="30" r="1.5" fill="#01c2c3"/>
          </svg>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', letterSpacing: 1 }}>淘好物</div>
        <div style={{ fontSize: 14, color: '#aaa', marginTop: 6 }}>发现好物，轻松购买</div>
      </div>

      {/* Form card */}
      <div style={{
        margin: '0 18px',
        background: '#fff',
        borderRadius: 24,
        padding: '8px 20px 28px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.09)',
        animation: 'page-enter 0.4s 0.08s ease both',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 22 }}>
          {(['code', 'password'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, border: 'none', background: 'none', padding: '16px 0 13px',
                fontSize: 15, fontWeight: tab === t ? 700 : 400,
                color: tab === t ? '#01c2c3' : '#bbb',
                cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
                transition: 'color 0.2s',
              }}
            >
              {t === 'code' ? '验证码登录' : '密码登录'}
              {tab === t && (
                <span style={{
                  position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 28, height: 3, background: '#01c2c3', borderRadius: '2px 2px 0 0',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Code login */}
        {tab === 'code' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'page-enter 0.2s ease both' }}>
            <MobileInput
              type="email"
              placeholder="请输入邮箱地址"
              value={codeEmail}
              onChange={setCodeEmail}
              prefix={<MailOutlined />}
            />
            <MobileInput
              placeholder="请输入验证码"
              value={code}
              onChange={setCode}
              prefix={<SafetyOutlined />}
              onKeyDown={(e) => { if (e.key === 'Enter') onCodeLogin() }}
              suffix={
                <button
                  onClick={sendCode}
                  disabled={sending || countdown > 0}
                  style={{
                    border: 'none', background: 'none', padding: '0 0 0 8px',
                    fontSize: 13, fontWeight: 600, cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    color: countdown > 0 ? '#ccc' : '#01c2c3', whiteSpace: 'nowrap',
                    fontFamily: 'inherit', flexShrink: 0,
                    transition: 'color 0.2s',
                  }}
                >
                  {sending ? '发送中…' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              }
            />
            <button
              className="btn btn-primary btn-xl btn-block"
              onClick={onCodeLogin}
              disabled={codeLoading}
              style={{ borderRadius: 14, marginTop: 4, opacity: codeLoading ? 0.75 : 1 }}
            >
              {codeLoading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> 登录中…</>
                : '登录 / 注册'}
            </button>
          </div>
        )}

        {/* Password login */}
        {tab === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'page-enter 0.2s ease both' }}>
            <MobileInput
              type="email"
              placeholder="请输入邮箱地址"
              value={pwdEmail}
              onChange={setPwdEmail}
              prefix={<MailOutlined />}
            />
            <MobileInput
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={setPassword}
              prefix={<LockOutlined />}
              onKeyDown={(e) => { if (e.key === 'Enter') onPasswordLogin() }}
            />
            <button
              className="btn btn-primary btn-xl btn-block"
              onClick={onPasswordLogin}
              disabled={pwdLoading}
              style={{ borderRadius: 14, marginTop: 4, opacity: pwdLoading ? 0.75 : 1 }}
            >
              {pwdLoading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> 登录中…</>
                : '登录'}
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#ccc', animation: 'page-enter 0.4s 0.15s ease both' }}>
        未注册的邮箱登录后将自动注册
      </div>
    </div>
  )
}

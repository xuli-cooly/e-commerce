import { useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

/**
 * KeepAliveOutlet
 * 每个路径只挂载一次对应的页面组件。切换路由时用 CSS display 隐藏/显示，
 * 而不是卸载，从而保留页面状态并避免重复请求。
 */
function KeepAliveOutlet() {
  const location = useLocation()
  const currentOutlet = useOutlet()
  const cacheRef = useRef<Map<string, React.ReactNode>>(new Map())

  if (currentOutlet && !cacheRef.current.has(location.pathname)) {
    cacheRef.current.set(location.pathname, currentOutlet)
  }

  return (
    <>
      {Array.from(cacheRef.current.entries()).map(([path, element]) => (
        <div
          key={path}
          style={{ display: location.pathname === path ? 'block' : 'none' }}
        >
          {element}
        </div>
      ))}
    </>
  )
}

export default function AdminLayout() {
  return (
    <div style={{ margin: 24, background: '#fff', borderRadius: 8, padding: 24, overflow: 'auto' }}>
      <KeepAliveOutlet />
    </div>
  )
}

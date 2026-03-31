import { Badge } from 'antd'
import {
  HomeOutlined, HomeFilled,
  ShoppingCartOutlined, ShoppingFilled,
  CompassOutlined, CompassFilled,
  UserOutlined, UserSwitchOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

const tabs = [
  { path: '/',          ActiveIcon: HomeFilled,        Icon: HomeOutlined,          label: '首页' },
  { path: '/community', ActiveIcon: CompassFilled,     Icon: CompassOutlined,       label: '社区' },
  { path: '/cart',      ActiveIcon: ShoppingFilled,    Icon: ShoppingCartOutlined,  label: '购物车' },
  { path: '/profile',   ActiveIcon: UserSwitchOutlined, Icon: UserOutlined,         label: '我的' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const count = useCartStore((s) => s.count)

  return (
    <nav className="bottom-nav">
      {tabs.map(({ path, ActiveIcon, Icon, label }) => {
        const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
        const IconComp = active ? ActiveIcon : Icon
        return (
          <div
            key={path}
            className={`bottom-nav-item${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
          >
            {path === '/cart' ? (
              <Badge count={count} size="small" offset={[6, -2]}>
                <span className="nav-icon"><IconComp /></span>
              </Badge>
            ) : (
              <span className="nav-icon"><IconComp /></span>
            )}
            <span>{label}</span>
          </div>
        )
      })}
    </nav>
  )
}

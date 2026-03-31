import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface NavBarProps {
  title: string
  back?: boolean
  right?: React.ReactNode
}

export default function NavBar({ title, back = false, right }: NavBarProps) {
  const navigate = useNavigate()
  return (
    <div className="navbar">
      {back && (
        <span className="navbar-back" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </span>
      )}
      <span className="navbar-title">{title}</span>
      {right && <span className="navbar-right">{right}</span>}
    </div>
  )
}

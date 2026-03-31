import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import PostsPage from './pages/PostsPage'
import { useCommunityStore } from './store/communityStore'

interface AppProps {
  basename?: string
  globalState?: { token?: string; role?: string }
}

export default function App({ basename = '/', globalState }: AppProps) {
  const setToken = useCommunityStore((s) => s.setToken)

  useEffect(() => {
    if (globalState?.token) {
      setToken(globalState.token)
    }
  }, [globalState?.token, setToken])

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/" element={<Navigate to="/posts" replace />} />
        <Route path="*" element={<Navigate to="/posts" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

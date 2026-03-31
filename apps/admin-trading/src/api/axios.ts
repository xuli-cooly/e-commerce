import { createHttpClient } from '@trading/shared'

const http = createHttpClient({
  tokenKey: 'admin_token',
  onUnauthorized: () => {
    localStorage.removeItem('admin_token')
    window.history.pushState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  },
})

export default http

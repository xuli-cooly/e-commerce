import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('admin_shell_auth')
  if (raw) {
    try {
      const state = JSON.parse(raw)
      const token = state?.state?.token
      if (token) config.headers['Authorization'] = `Bearer ${token}`
    } catch {
      // ignore
    }
  }
  return config
})

export default api

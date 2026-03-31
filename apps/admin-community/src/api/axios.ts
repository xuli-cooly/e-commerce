import axios from 'axios'
import { useCommunityStore } from '../store/communityStore'

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use((config) => {
  const token = useCommunityStore.getState().token
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

export default api

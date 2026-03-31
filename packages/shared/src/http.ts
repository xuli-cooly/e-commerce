import axios, { type AxiosInstance } from 'axios'

export interface CreateHttpClientOptions {
  tokenKey: string
  onUnauthorized?: () => void
}

export function createHttpClient(options: CreateHttpClientOptions): AxiosInstance {
  const { tokenKey, onUnauthorized } = options

  const instance = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
  })

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(tokenKey)
        if (onUnauthorized) {
          onUnauthorized()
        } else {
          window.location.href = '/login'
        }
      }
      return Promise.reject(err)
    }
  )

  return instance
}

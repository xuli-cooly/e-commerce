// Thin re-export with the name expected by App.tsx when running as qiankun sub-app.
import { create } from 'zustand'
import api from '../api/axios'

interface AdminStoreState {
  token: string | null
  setToken: (token: string) => void
}

export const useAdminStore = create<AdminStoreState>()((set) => ({
  token: localStorage.getItem('admin_token'),
  setToken: (token) => {
    localStorage.setItem('admin_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    set({ token })
  },
}))

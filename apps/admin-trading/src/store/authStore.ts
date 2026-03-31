import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminAuthState {
  token: string | null
  userId: number | null
  setAuth: (token: string, userId: number) => void
  clearAuth: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      setAuth: (token, userId) => set({ token, userId }),
      clearAuth: () => set({ token: null, userId: null }),
    }),
    { name: 'admin_auth' }
  )
)

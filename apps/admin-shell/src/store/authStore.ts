import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ShellAuthState {
  token: string | null
  userId: number | null
  role: string | null
  setAuth: (token: string, userId: number, role: string) => void
  clearAuth: () => void
}

export const useShellAuthStore = create<ShellAuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      role: null,
      setAuth: (token, userId, role) => {
        // Sync token to the key sub-apps read directly from localStorage
        localStorage.setItem('admin_token', token)
        set({ token, userId, role })
      },
      clearAuth: () => {
        localStorage.removeItem('admin_token')
        set({ token: null, userId: null, role: null })
      },
    }),
    { name: 'admin_shell_auth' }
  )
)

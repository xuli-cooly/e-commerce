import { create } from 'zustand'

interface CommunityStoreState {
  token: string | null
  setToken: (token: string) => void
}

export const useCommunityStore = create<CommunityStoreState>()((set) => ({
  token: localStorage.getItem('admin_shell_auth')
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem('admin_shell_auth')!)?.state?.token ?? null
        } catch {
          return null
        }
      })()
    : null,
  setToken: (token) => {
    set({ token })
  },
}))

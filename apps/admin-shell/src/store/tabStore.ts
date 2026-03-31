import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TabItem {
  key: string
  title: string
  path: string
  fixed?: boolean
}

const MAX_TABS = 10

interface TabStore {
  tabs: TabItem[]
  activeKey: string
  openTab: (tab: TabItem) => void
  closeTab: (key: string) => void
  setActive: (key: string) => void
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [{ key: '/admin/trading/stats', title: '数据概览', path: '/admin/trading/stats', fixed: true }],
      activeKey: '/admin/trading/stats',

      openTab: (tab) => {
        const { tabs } = get()
        const exists = tabs.find((t) => t.key === tab.key)
        if (exists) {
          set({ activeKey: tab.key })
          return
        }
        let next = [...tabs]
        if (next.length >= MAX_TABS) {
          const dropIdx = next.findIndex((t) => !t.fixed)
          if (dropIdx !== -1) next.splice(dropIdx, 1)
        }
        next.push(tab)
        set({ tabs: next, activeKey: tab.key })
      },

      closeTab: (key) => {
        const { tabs, activeKey } = get()
        const tab = tabs.find((t) => t.key === key)
        if (!tab || tab.fixed) return
        const next = tabs.filter((t) => t.key !== key)
        let nextActive = activeKey
        if (activeKey === key) {
          const idx = tabs.findIndex((t) => t.key === key)
          nextActive = next[Math.max(0, idx - 1)]?.key ?? next[0]?.key ?? '/admin/trading/stats'
        }
        set({ tabs: next, activeKey: nextActive })
      },

      setActive: (key) => set({ activeKey: key }),
    }),
    {
      name: 'shell_admin_tabs',
      storage: {
        getItem: (name) => {
          const val = sessionStorage.getItem(name)
          return val ? JSON.parse(val) : null
        },
        setItem: (name, val) => sessionStorage.setItem(name, JSON.stringify(val)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
)

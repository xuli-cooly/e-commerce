import { create } from 'zustand'

interface CartStore {
  count: number
  setCount: (n: number) => void
  increment: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

import { create } from 'zustand'
import { api } from '../lib/api'
import { invalidateQueries } from '../lib/queryClient'

interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  hasCheckedAuth: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  hasCheckedAuth: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await api.post('/auth/login', { email, password })
      set({ user: response.data.user, isLoading: false, hasCheckedAuth: true })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await api.post('/auth/register', { name, email, password })
      const { user } = response.data
      set({ user, isLoading: false, hasCheckedAuth: true })
      
      // Invalidate groups query for the newly registered user
      if (user?.id) {
        invalidateQueries(['groups', user.id])
      }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({ user: null, hasCheckedAuth: true })
    }
  },

  checkAuth: async () => {
    const { hasCheckedAuth, isLoading } = get()
    
    // Prevent multiple simultaneous auth checks
    if (hasCheckedAuth || isLoading) {
      return
    }

    set({ isLoading: true })
    try {
      const response = await api.get('/me')
      set({ user: response.data.user, isLoading: false, hasCheckedAuth: true })
    } catch (error) {
      set({ user: null, isLoading: false, hasCheckedAuth: true })
    }
  },
}))

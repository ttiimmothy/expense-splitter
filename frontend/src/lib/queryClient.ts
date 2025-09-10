import { QueryClient } from '@tanstack/react-query'

// Global query client instance
let globalQueryClient: QueryClient | null = null

export const setGlobalQueryClient = (queryClient: QueryClient) => {
  globalQueryClient = queryClient
}

export const getGlobalQueryClient = (): QueryClient | null => {
  return globalQueryClient
}

// Helper function to invalidate queries
export const invalidateQueries = (queryKey: any[]) => {
  if (globalQueryClient) {
    globalQueryClient.invalidateQueries({ queryKey })
  }
}
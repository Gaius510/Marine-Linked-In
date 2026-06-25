import { QueryClient } from '@tanstack/react-query'

// Shared singleton so non-React modules (e.g. the auth store) can access it.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      retryDelay: 600,
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
    },
  },
})

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'

import { config } from './wagmi.config'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import {
  DEFAULT_QUERY_STALE_TIME,
  DEFAULT_QUERY_RETRY,
  TOAST_DEFAULT_DURATION,
  TOAST_SUCCESS_DURATION,
  TOAST_ERROR_DURATION,
} from './constants/config'

import './index.css'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: DEFAULT_QUERY_RETRY,
      staleTime: DEFAULT_QUERY_STALE_TIME,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={config} reconnectOnMount={true}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: TOAST_DEFAULT_DURATION,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: TOAST_SUCCESS_DURATION,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: TOAST_ERROR_DURATION,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </StrictMode>
)

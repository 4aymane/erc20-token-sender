import { TOAST_LONG_DURATION, TOAST_DEFAULT_DURATION } from '../constants/config'
import type { Transaction } from '../types'

// Cross-tab synchronization using BroadcastChannel
const CHANNEL_NAME = 'erc20-transactions'

type SyncMessage =
  | { type: 'TX_ADDED'; transaction: Transaction }
  | { type: 'TX_UPDATED'; hash: string; updates: Partial<Transaction> }
  | {
      type: 'TOAST'
      toastType: 'success' | 'error' | 'default'
      message: string
      icon?: string
      duration?: number
    }

type SyncListener = (message: SyncMessage) => void

class TransactionSyncService {
  private channel: BroadcastChannel | null = null
  private listeners: Set<SyncListener> = new Set()

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME)
        this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
          this.notifyListeners(event.data)
        }
      } catch {
        // BroadcastChannel not available, continue without cross-tab sync
      }
    }
  }

  broadcast(message: SyncMessage): void {
    this.notifyListeners(message)

    if (this.channel) {
      try {
        this.channel.postMessage(message)
      } catch {
        // Silently handle broadcast errors
      }
    }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(message: SyncMessage): void {
    this.listeners.forEach((listener) => listener(message))
  }
}

export const transactionSync = new TransactionSyncService()

// Helper functions for common toast patterns
const broadcastToast = (
  toastType: 'success' | 'error' | 'default',
  message: string,
  options?: { icon?: string; duration?: number }
): void => {
  transactionSync.broadcast({
    type: 'TOAST',
    toastType,
    message,
    ...(options?.icon && { icon: options.icon }),
    ...(options?.duration !== undefined && { duration: options.duration }),
  })
}

export const broadcastErrorToast = (
  message: string,
  duration = TOAST_LONG_DURATION
): void => {
  broadcastToast('error', message, { duration })
}

export const broadcastSuccessToast = (message: string, duration?: number): void => {
  broadcastToast('success', message, duration ? { duration } : undefined)
}

export const broadcastDefaultToast = (
  message: string,
  icon?: string,
  duration = TOAST_DEFAULT_DURATION
): void => {
  broadcastToast('default', message, { icon, duration })
}

// Helper function for transaction updates
export const broadcastTransactionUpdate = (
  hash: string,
  updates: Partial<Transaction>
): void => {
  transactionSync.broadcast({
    type: 'TX_UPDATED',
    hash,
    updates,
  })
}

// Helper function for transaction added
export const broadcastTransactionAdded = (transaction: Transaction): void => {
  transactionSync.broadcast({
    type: 'TX_ADDED',
    transaction,
  })
}

import { useEffect } from 'react'
import { transactionSync } from '../services/transactionSync'
import toast from 'react-hot-toast'
import type { Transaction } from '../types'

interface UseCrossTabOptions {
  onTransactionAdded?: (transaction: Transaction) => void
  onTransactionUpdated?: (hash: string, updates: Partial<Transaction>) => void
  enableToasts?: boolean
}

export const useCrossTab = ({
  onTransactionAdded,
  onTransactionUpdated,
  enableToasts = false,
}: UseCrossTabOptions = {}) => {
  useEffect(() => {
    const unsubscribe = transactionSync.subscribe((message) => {
      switch (message.type) {
        case 'TX_ADDED':
          onTransactionAdded?.(message.transaction)
          break
        case 'TX_UPDATED':
          onTransactionUpdated?.(message.hash, message.updates)
          break
        case 'TOAST':
          if (enableToasts) {
            const options = {
              ...(message.icon && { icon: message.icon }),
              ...(message.duration !== undefined && { duration: message.duration }),
            }

            switch (message.toastType) {
              case 'success':
                toast.success(message.message, options)
                break
              case 'error':
                toast.error(message.message, options)
                break
              case 'default':
                toast(message.message, options)
                break
            }
          }
          break
      }
    })

    return unsubscribe
  }, [onTransactionAdded, onTransactionUpdated, enableToasts])
}


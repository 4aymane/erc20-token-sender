import { useEffect, useRef } from 'react'
import { usePublicClient, useAccount } from 'wagmi'
import { getAllTransactions } from '../services/transactionStorage'
import { monitorSingleTransaction } from '../services/transactionMonitor'
import { broadcastErrorToast, transactionSync } from '../services/transactionSync'
import { shouldIgnoreError, getErrorReasonFromChain } from '../utils/errorHandling'
import { TOAST_ERROR_DURATION } from '../constants/config'

/**
 * Monitors pending transactions in the visible tab only.
 * Uses Page Visibility API to prevent duplicate calls across tabs.
 */
export const useTransactionMonitor = () => {
  const publicClient = usePublicClient()
  const { address, chainId } = useAccount()
  const activeMonitorsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!publicClient || !address || !chainId) return

    const startMonitoring = async (specificTxHash?: string) => {
      if (document.hidden) {
        return
      }

      try {
        const allTransactions = await getAllTransactions()
        let pendingTransactions = allTransactions.filter(
          (tx) => tx.status === 'pending' && tx.chainId === chainId
        )

        if (specificTxHash) {
          pendingTransactions = pendingTransactions.filter(
            (tx) => tx.hash === specificTxHash
          )
        }

        pendingTransactions.forEach((tx) => {
          if (activeMonitorsRef.current.has(tx.hash)) {
            return
          }

          activeMonitorsRef.current.add(tx.hash)

          monitorSingleTransaction(tx, publicClient, allTransactions)
            .catch((error) => {
              if (!shouldIgnoreError(error)) {
                const reason = getErrorReasonFromChain(error)
                const message = reason ? reason : 'Network error. Please try again'
                broadcastErrorToast(message, TOAST_ERROR_DURATION)
              }
            })
            .finally(() => {
              activeMonitorsRef.current.delete(tx.hash)
            })
        })
      } catch (error) {
        if (!shouldIgnoreError(error)) {
          const reason = getErrorReasonFromChain(error)
          const message = reason ? reason : 'Network error. Please try again'
          broadcastErrorToast(message, TOAST_ERROR_DURATION)
        }
      }
    }

    startMonitoring()

    const unsubscribe = transactionSync.subscribe((message) => {
      if (message.type === 'TX_ADDED' && message.transaction.status === 'pending') {
        if (message.transaction.chainId === chainId) {
          startMonitoring(message.transaction.hash)
        }
      }
    })

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        startMonitoring()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [publicClient, address, chainId])
}

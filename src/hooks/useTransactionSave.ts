import { useEffect, useRef } from 'react'
import { usePublicClient, useAccount } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { saveTransaction } from '../services/transactionStorage'
import {
  broadcastTransactionAdded,
  broadcastDefaultToast,
} from '../services/transactionSync'
import { isUserCancellation, isRateLimitError } from '../utils/errorHandling'
import { isHash } from 'viem'
import type { Token, Transaction } from '../types'

interface UseTransactionSaveProps {
  txHash: string | undefined
  selectedToken: Token | null
  amount: string
  recipient: string
  error: unknown
  onSuccess: () => void
}

/**
 * Saves transaction to IndexedDB and broadcasts to other tabs when a new transaction is created.
 * Prevents duplicate saves and handles user cancellations.
 */
export const useTransactionSave = ({
  txHash,
  selectedToken,
  amount,
  recipient,
  error,
  onSuccess,
}: UseTransactionSaveProps) => {
  const publicClient = usePublicClient()
  const { chainId } = useAccount()
  const savedHashes = useRef(new Set<string>())
  const lastSavedKey = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedToken) return

    const saveAndBroadcast = async () => {
      try {
        if (!txHash) return

        if (isUserCancellation(error)) {
          return
        }

        const saveKey = `tx_${txHash}`
        if (lastSavedKey.current === saveKey) return
        if (savedHashes.current.has(txHash)) return

        savedHashes.current.add(txHash)
        lastSavedKey.current = saveKey

        let nonce: number | undefined = undefined
        if (publicClient && txHash && isHash(txHash)) {
          try {
            const tx = await publicClient.getTransaction({
              hash: txHash,
            })
            nonce = tx.nonce !== undefined ? Number(tx.nonce) : undefined
          } catch (error) {
            if (isRateLimitError(error)) {
              // Nonce optional - will be fetched during monitoring if needed
            }
          }
        }

        const transaction: Transaction = {
          hash: txHash,
          chainId: chainId || sepolia.id,
          status: 'pending',
          tokenAddress: selectedToken.address,
          tokenSymbol: selectedToken.symbol,
          tokenDecimals: selectedToken.decimals,
          amount,
          recipient,
          timestamp: Date.now(),
          nonce,
        }

        await saveTransaction(transaction)
        broadcastTransactionAdded(transaction)
        broadcastDefaultToast('Transaction submitted!', '⏳')
        onSuccess()
      } catch (error) {
        console.error('Failed to save transaction:', error)
      }
    }

    saveAndBroadcast()
    return () => {
      lastSavedKey.current = null
    }
  }, [txHash, selectedToken, amount, recipient, error, onSuccess, publicClient, chainId])

  useEffect(() => {
    const hashes = savedHashes.current
    return () => {
      hashes.clear()
    }
  }, [])
}

import type { PublicClient } from 'viem'
import { isHash } from 'viem'
import type { Transaction } from '../types'
import { shouldIgnoreError } from './errorHandling'

/**
 * Finds pending transactions with the same nonce.
 * Used to detect when one transaction will replace others when confirmed.
 */
export function findPendingSameNonce(
  allTransactions: Transaction[],
  nonce: number,
  excludeHash: string
): Transaction[] {
  return allTransactions.filter(
    (tx) => tx.nonce === nonce && tx.hash !== excludeHash && tx.status === 'pending'
  )
}

/**
 * Checks if a transaction is a cancellation (0-value transfer to self).
 */
export async function isCancelTransaction(
  txHash: string,
  publicClient: PublicClient
): Promise<boolean> {
  if (!isHash(txHash)) {
    throw new Error(`Invalid transaction hash: ${txHash}`)
  }
  try {
    const blockchainTx = await publicClient.getTransaction({
      hash: txHash,
    })

    return (
      blockchainTx.value === 0n &&
      blockchainTx.from.toLowerCase() === blockchainTx.to?.toLowerCase()
    )
  } catch (error) {
    console.error(`[TX_HELPER] Error checking cancel transaction ${txHash}:`, error)
    if (shouldIgnoreError(error)) {
      return false
    }
    throw error
  }
}

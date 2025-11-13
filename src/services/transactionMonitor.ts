import { formatUnits, isHash } from 'viem'
import type { PublicClient } from 'viem'
import {
  waitForTransactionReceipt,
  getTransaction as getOnChainTransaction,
} from 'viem/actions'
import {
  updateTransaction,
  getTransaction,
  getAllTransactions,
} from './transactionStorage'
import {
  broadcastTransactionUpdate,
  broadcastDefaultToast,
  broadcastSuccessToast,
  broadcastErrorToast,
} from './transactionSync'
import {
  shouldIgnoreError,
  getErrorReasonFromChain,
  isTransactionNotFoundError,
  isTimeoutError,
} from '../utils/errorHandling'
import { findPendingSameNonce, isCancelTransaction } from '../utils/transactionHelpers'
import { TX_RECEIPT_TIMEOUT } from '../constants/config'
import type { Transaction } from '../types'

/**
 * Marks a transaction as replaced. Handles repriced, cancelled, and replaced transactions.
 * If no replacement hash is found, adds errorMessage noting it might be cancelled.
 */
export async function markAsReplaced(
  txHash: string,
  replacedBy: string | null,
  reason?: 'repriced' | 'cancelled' | 'replaced',
  showToast: boolean = true
): Promise<void> {
  const originalTx = await getTransaction(txHash)

  if (!originalTx || originalTx.status === 'replaced') {
    return
  }

  const updates: Partial<Transaction> = {
    status: 'replaced',
    replacedTransactionHash: replacedBy || null,
  }

  if (reason === 'cancelled') {
    updates.errorMessage = 'Transaction was cancelled (replaced by a cancel transaction)'
  } else if (!replacedBy) {
    updates.errorMessage =
      'Transaction was replaced or might be cancelled (replacement hash not found)'
  }

  await updateTransaction(txHash, updates)

  broadcastTransactionUpdate(txHash, updates)

  if (showToast) {
    const messages: Record<string, string> = {
      repriced: 'Transaction sped up with higher gas price',
      replaced: 'Transaction replaced with new parameters',
      cancelled: 'Transaction replaced (may have been cancelled)',
    }

    const message =
      reason && messages[reason] ? messages[reason] : 'Transaction was replaced'

    broadcastDefaultToast(message, '↻')
  }
}

/**
 * Processes a transaction receipt and updates status, gas info, and notifications.
 * Handles confirmed (success/reverted), replaced, and cancellation transactions.
 * Marks other pending transactions with same nonce as replaced when one confirms.
 */
export async function handleTransactionReceipt(
  tx: Transaction,
  receipt: Awaited<ReturnType<PublicClient['getTransactionReceipt']>>,
  publicClient: PublicClient,
  allTransactions: Transaction[],
  isReplacement: boolean = false
): Promise<void> {
  try {
    const currentTx = await getTransaction(tx.hash)

    const isAlreadyReplaced = currentTx?.status === 'replaced'
    if (isAlreadyReplaced && !isReplacement) {
      return
    }
    const finalStatus: 'confirmed' | 'replaced' =
      isReplacement || isAlreadyReplaced ? 'replaced' : 'confirmed'

    const isCancelTx = await isCancelTransaction(receipt.transactionHash, publicClient)

    // Mark other pending transactions with same nonce as replaced when cancel tx confirms
    if (isCancelTx) {
      if (receipt.status === 'success' && tx.nonce !== undefined) {
        const pendingSameNonce = findPendingSameNonce(allTransactions, tx.nonce, tx.hash)

        for (const pendingTx of pendingSameNonce) {
          await markAsReplaced(pendingTx.hash, receipt.transactionHash, 'cancelled')
        }
      }
      return
    }

    const gasUsed = receipt.gasUsed ? receipt.gasUsed.toString() : undefined
    const effectiveGasPrice = receipt.effectiveGasPrice
      ? receipt.effectiveGasPrice.toString()
      : undefined

    let totalGasFee: string | undefined = undefined
    if (receipt.gasUsed && receipt.effectiveGasPrice) {
      const totalWei = receipt.gasUsed * receipt.effectiveGasPrice
      const totalEth = formatUnits(totalWei, 18)
      totalGasFee = totalEth.replace(/\.?0+$/, '')
    }

    const updateData: Partial<Transaction> = {
      status: finalStatus,
      gasUsed,
      effectiveGasPrice,
      totalGasFee,
    }

    if (isReplacement) {
      updateData.replacedTransactionHash = receipt.transactionHash
    }

    if (receipt.status !== 'success' && !isReplacement && !isAlreadyReplaced) {
      updateData.errorMessage = 'Transaction reverted (execution failed)'
    }

    await updateTransaction(tx.hash, updateData)

    broadcastTransactionUpdate(tx.hash, updateData)

    if (finalStatus === 'confirmed' && tx.nonce !== undefined) {
      const pendingSameNonce = findPendingSameNonce(allTransactions, tx.nonce, tx.hash)

      for (const pendingTx of pendingSameNonce) {
        await markAsReplaced(pendingTx.hash, tx.hash, 'repriced', false)
      }
    }

    if (finalStatus === 'confirmed') {
      if (receipt.status === 'success') {
        const message = `Transaction confirmed! ${tx.amount} ${tx.tokenSymbol} sent`
        broadcastSuccessToast(message)
      } else {
        broadcastErrorToast('Transaction failed (reverted)')
      }
    } else if (finalStatus === 'replaced' && !isAlreadyReplaced) {
      broadcastDefaultToast('Transaction replaced', '↻')
    }
  } catch (error) {
    console.error(`[TX_RECEIPT] Error handling receipt for ${tx.hash}:`, error)
    if (shouldIgnoreError(error)) {
      return
    }
    const reason = getErrorReasonFromChain(error)
    const message = reason ? reason : 'Transaction failed'
    broadcastErrorToast(message)
  }
}

/**
 * Monitors a transaction until confirmed or replaced.
 * Uses Viem's onReplaced callback for replacement detection.
 * Reverted transactions are marked as 'confirmed' with errorMessage (on-chain).
 */
export async function monitorSingleTransaction(
  tx: Transaction,
  publicClient: PublicClient,
  allTransactions?: Transaction[]
): Promise<void> {
  try {
    const txHash = tx.hash
    if (!isHash(txHash)) {
      throw new Error(`Invalid transaction hash: ${txHash}`)
    }

    try {
      await getOnChainTransaction(publicClient, { hash: txHash })
    } catch (checkError) {
      if (isTransactionNotFoundError(checkError)) {
        const currentTx = await getTransaction(txHash)
        if (currentTx && currentTx.status === 'pending') {
          await markAsReplaced(txHash, null, 'replaced')
        }
        return
      }
    }

    let replacementPromise: Promise<void> | null = null
    const receipt = await waitForTransactionReceipt(publicClient, {
      hash: txHash,
      onReplaced: (replacement) => {
        const replacementHash = replacement.transaction?.hash || null
        const reason = replacement.reason as
          | 'repriced'
          | 'cancelled'
          | 'replaced'
          | undefined
        replacementPromise = markAsReplaced(tx.hash, replacementHash, reason).catch(
          () => {
            // Error handled gracefully - transaction will be marked as replaced on next check
          }
        )
      },
      timeout: TX_RECEIPT_TIMEOUT,
    })

    const transactions = allTransactions || (await getAllTransactions())

    if (receipt.transactionHash !== tx.hash) {
      if (replacementPromise) {
        await replacementPromise
      }
      await handleTransactionReceipt(tx, receipt, publicClient, transactions, true)
      return
    }

    await handleTransactionReceipt(tx, receipt, publicClient, transactions)
  } catch (error) {
    if (isTimeoutError(error)) {
      return
    }

    if (isTransactionNotFoundError(error)) {
      const currentTx = await getTransaction(tx.hash)
      if (currentTx && currentTx.status === 'pending') {
        await markAsReplaced(tx.hash, null, 'replaced')
      }
      return
    }

    if (shouldIgnoreError(error)) {
      return
    }

    console.error(`[TX_MONITOR] Unhandled error for transaction ${tx.hash}:`, error)
  }
}

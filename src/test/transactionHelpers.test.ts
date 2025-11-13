import { describe, it, expect } from 'vitest'
import { findPendingSameNonce } from '../utils/transactionHelpers'
import type { Transaction } from '../types'

describe('findPendingSameNonce', () => {
  const createTx = (
    hash: string,
    nonce: number,
    status: 'pending' | 'confirmed' | 'replaced' = 'pending'
  ): Transaction => ({
    hash,
    chainId: 11155111,
    status,
    tokenAddress: '0x123',
    tokenSymbol: 'USDC',
    tokenDecimals: 6,
    amount: '100',
    recipient: '0x456',
    timestamp: Date.now(),
    nonce,
  })

  it('finds pending transactions with same nonce and excludes non-pending and specified hash', () => {
    const tx1 = createTx('0x111', 5, 'pending')
    const tx2 = createTx('0x222', 5, 'pending')
    const tx3 = createTx('0x333', 5, 'confirmed')
    const tx4 = createTx('0x444', 5, 'replaced')
    const tx5 = createTx('0x555', 6, 'pending') // Different nonce
    const allTxs = [tx1, tx2, tx3, tx4, tx5]

    const result = findPendingSameNonce(allTxs, 5, '0x111')
    expect(result).not.toContain(tx1) // Excludes specified hash
    expect(result).toContain(tx2) // Includes other pending with same nonce
    expect(result).not.toContain(tx3) // Excludes confirmed
    expect(result).not.toContain(tx4) // Excludes replaced
    expect(result).not.toContain(tx5) // Excludes different nonce
  })

  it('returns empty array when no matching transactions', () => {
    const tx1 = createTx('0x111', 5, 'pending')
    const allTxs = [tx1]

    const result = findPendingSameNonce(allTxs, 10, '0x111')
    expect(result).toEqual([])
  })

  it('handles multiple pending transactions with same nonce', () => {
    const tx1 = createTx('0x111', 5, 'pending')
    const tx2 = createTx('0x222', 5, 'pending')
    const tx3 = createTx('0x333', 5, 'pending')
    const allTxs = [tx1, tx2, tx3]

    const result = findPendingSameNonce(allTxs, 5, '0x111')
    expect(result).toHaveLength(2)
    expect(result).toContain(tx2)
    expect(result).toContain(tx3)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PublicClient } from 'viem'
import type { Transaction as ViemTransaction } from 'viem'
import { markAsReplaced } from '../services/transactionMonitor'
import { isCancelTransaction } from '../utils/transactionHelpers'
import * as transactionStorage from '../services/transactionStorage'
import type { Transaction } from '../types'

// Mock dependencies
vi.mock('../services/transactionStorage')
vi.mock('../services/transactionSync', () => ({
  broadcastTransactionUpdate: vi.fn(),
  broadcastDefaultToast: vi.fn(),
}))

describe('markAsReplaced', () => {
  const mockTx: Transaction = {
    hash: '0x111',
    chainId: 11155111,
    status: 'pending',
    tokenAddress: '0x123',
    tokenSymbol: 'USDC',
    tokenDecimals: 6,
    amount: '100',
    recipient: '0x456',
    timestamp: Date.now(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles repriced transactions', async () => {
    vi.mocked(transactionStorage.getTransaction).mockResolvedValue(mockTx)
    vi.mocked(transactionStorage.updateTransaction).mockResolvedValue()

    await markAsReplaced('0x111', '0x222', 'repriced', true)

    expect(transactionStorage.updateTransaction).toHaveBeenCalledWith('0x111', {
      status: 'replaced',
      replacedTransactionHash: '0x222',
    })
  })

  it('handles cancelled transactions with error message', async () => {
    vi.mocked(transactionStorage.getTransaction).mockResolvedValue(mockTx)
    vi.mocked(transactionStorage.updateTransaction).mockResolvedValue()

    await markAsReplaced('0x111', '0x222', 'cancelled', true)

    expect(transactionStorage.updateTransaction).toHaveBeenCalledWith('0x111', {
      status: 'replaced',
      replacedTransactionHash: '0x222',
      errorMessage: 'Transaction was cancelled (replaced by a cancel transaction)',
    })
  })

  it('handles replaced transactions without replacement hash', async () => {
    vi.mocked(transactionStorage.getTransaction).mockResolvedValue(mockTx)
    vi.mocked(transactionStorage.updateTransaction).mockResolvedValue()

    await markAsReplaced('0x111', null, 'replaced', true)

    expect(transactionStorage.updateTransaction).toHaveBeenCalledWith('0x111', {
      status: 'replaced',
      replacedTransactionHash: null,
      errorMessage:
        'Transaction was replaced or might be cancelled (replacement hash not found)',
    })
  })

  it('skips if transaction is already replaced', async () => {
    const alreadyReplaced = { ...mockTx, status: 'replaced' as const }
    vi.mocked(transactionStorage.getTransaction).mockResolvedValue(alreadyReplaced)

    await markAsReplaced('0x111', '0x222', 'repriced', true)

    expect(transactionStorage.updateTransaction).not.toHaveBeenCalled()
  })

  it('skips if transaction does not exist', async () => {
    vi.mocked(transactionStorage.getTransaction).mockResolvedValue(undefined)

    await markAsReplaced('0x111', '0x222', 'repriced', true)

    expect(transactionStorage.updateTransaction).not.toHaveBeenCalled()
  })
})

describe('isCancelTransaction', () => {
  const mockPublicClient = {
    getTransaction: vi.fn(),
  } as unknown as PublicClient

  // Valid transaction hash (66 chars, starts with 0x)
  const validHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

  it('detects cancel transaction (0-value to self)', async () => {
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    vi.mocked(mockPublicClient.getTransaction).mockResolvedValue({
      value: 0n,
      from: address,
      to: address,
    } as Partial<ViemTransaction> as ViemTransaction)

    const result = await isCancelTransaction(validHash, mockPublicClient)
    expect(result).toBe(true)
  })

  it('returns false for normal transaction (non-zero value)', async () => {
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    vi.mocked(mockPublicClient.getTransaction).mockResolvedValue({
      value: BigInt('1000000000000000000'), // 1 ETH
      from: address,
      to: address,
    } as Partial<ViemTransaction> as ViemTransaction)

    const result = await isCancelTransaction(validHash, mockPublicClient)
    expect(result).toBe(false)
  })

  it('returns false for transaction to different address', async () => {
    vi.mocked(mockPublicClient.getTransaction).mockResolvedValue({
      value: 0n,
      from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    } as Partial<ViemTransaction> as ViemTransaction)

    const result = await isCancelTransaction(validHash, mockPublicClient)
    expect(result).toBe(false)
  })

  it('handles case-insensitive address comparison', async () => {
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    vi.mocked(mockPublicClient.getTransaction).mockResolvedValue({
      value: 0n,
      from: address.toLowerCase(),
      to: address.toUpperCase(),
    } as Partial<ViemTransaction> as ViemTransaction)

    const result = await isCancelTransaction(validHash, mockPublicClient)
    expect(result).toBe(true)
  })

  it('throws error for invalid hash', async () => {
    await expect(isCancelTransaction('invalid', mockPublicClient)).rejects.toThrow(
      'Invalid transaction hash'
    )
  })
})

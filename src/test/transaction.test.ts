import { describe, it, expect } from 'vitest'
import { formatUnits } from 'viem'
import { estimateBlocksForInclusion, formatGasEstimate } from '../utils/transaction'
import { BLOCK_TIME_SECONDS } from '../constants/config'

describe('estimateBlocksForInclusion', () => {
  it('returns 1-2 blocks for high priority (ratio >= 2)', () => {
    const baseFee = BigInt('1000000000') // 1 gwei
    const highPriority = BigInt('2000000000') // 2 gwei (ratio = 2)
    expect(estimateBlocksForInclusion(highPriority, baseFee)).toEqual({ min: 1, max: 2 })

    const veryHighPriority = BigInt('3000000000') // 3 gwei (ratio = 3)
    expect(estimateBlocksForInclusion(veryHighPriority, baseFee)).toEqual({
      min: 1,
      max: 2,
    })
  })

  it('returns 2-3 blocks for medium-high priority (ratio >= 1.5)', () => {
    const baseFee = BigInt('1000000000') // 1 gwei
    const mediumHigh = BigInt('1500000000') // 1.5 gwei (ratio = 1.5)
    expect(estimateBlocksForInclusion(mediumHigh, baseFee)).toEqual({ min: 2, max: 3 })

    const mediumHigh2 = BigInt('1990000000') // 1.99 gwei (ratio = 1.99)
    expect(estimateBlocksForInclusion(mediumHigh2, baseFee)).toEqual({ min: 2, max: 3 })
  })

  it('returns 3-5 blocks for medium priority (ratio >= 1)', () => {
    const baseFee = BigInt('1000000000') // 1 gwei
    const medium = BigInt('1000000000') // 1 gwei (ratio = 1)
    expect(estimateBlocksForInclusion(medium, baseFee)).toEqual({ min: 3, max: 5 })

    const medium2 = BigInt('1490000000') // 1.49 gwei (ratio = 1.49)
    expect(estimateBlocksForInclusion(medium2, baseFee)).toEqual({ min: 3, max: 5 })
  })

  it('returns 5-10 blocks for low priority (ratio < 1)', () => {
    const baseFee = BigInt('1000000000') // 1 gwei
    const low = BigInt('500000000') // 0.5 gwei (ratio = 0.5)
    expect(estimateBlocksForInclusion(low, baseFee)).toEqual({ min: 5, max: 10 })

    const veryLow = BigInt('100000000') // 0.1 gwei (ratio = 0.1)
    expect(estimateBlocksForInclusion(veryLow, baseFee)).toEqual({ min: 5, max: 10 })
  })
})

describe('formatGasEstimate', () => {
  it('returns null for invalid inputs', () => {
    expect(formatGasEstimate(0n, null)).toBeNull()
    expect(formatGasEstimate(100000n, null)).toBeNull()
    expect(
      formatGasEstimate(0n, {
        baseFeePerGas: BigInt('1000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
        maxFeePerGas: BigInt('3000000000'),
        estimatedCost: BigInt('3000000000'),
      })
    ).toBeNull()
  })

  it('calculates total cost correctly', () => {
    const estimatedGas = BigInt('21000') // Standard transfer gas
    const baseFee = BigInt('1000000000') // 1 gwei
    const priorityFee = BigInt('2000000000') // 2 gwei
    const estimatedCost = baseFee + priorityFee // 3 gwei

    const result = formatGasEstimate(estimatedGas, {
      baseFeePerGas: baseFee,
      maxPriorityFeePerGas: priorityFee,
      maxFeePerGas: BigInt('3000000000'),
      estimatedCost,
    })

    expect(result).not.toBeNull()
    if (result) {
      // 21000 * 3 gwei = 63000 gwei = 0.000063 ETH
      const expectedCost = formatUnits(estimatedGas * estimatedCost, 18)
      expect(result.totalCost).toBe(expectedCost)
      expect(result.maxFeePerGas).toBe(BigInt('3000000000'))
    }
  })

  it('calculates estimated time range based on priority ratio', () => {
    const estimatedGas = BigInt('21000')
    const baseFee = BigInt('1000000000') // 1 gwei
    const highPriority = BigInt('2000000000') // 2 gwei (ratio = 2, so 1-2 blocks)

    const result = formatGasEstimate(estimatedGas, {
      baseFeePerGas: baseFee,
      maxPriorityFeePerGas: highPriority,
      maxFeePerGas: BigInt('3000000000'),
      estimatedCost: baseFee + highPriority,
    })

    expect(result).not.toBeNull()
    if (result) {
      // High priority: 1-2 blocks * 12 seconds = 12-24 seconds
      expect(result.estimatedTimeRange.min).toBe(1 * BLOCK_TIME_SECONDS)
      expect(result.estimatedTimeRange.max).toBe(2 * BLOCK_TIME_SECONDS)
    }
  })

  it('handles low priority transactions correctly', () => {
    const estimatedGas = BigInt('21000')
    const baseFee = BigInt('1000000000') // 1 gwei
    const lowPriority = BigInt('500000000') // 0.5 gwei (ratio = 0.5, so 5-10 blocks)

    const result = formatGasEstimate(estimatedGas, {
      baseFeePerGas: baseFee,
      maxPriorityFeePerGas: lowPriority,
      maxFeePerGas: BigInt('1500000000'),
      estimatedCost: baseFee + lowPriority,
    })

    expect(result).not.toBeNull()
    if (result) {
      // Low priority: 5-10 blocks * 12 seconds = 60-120 seconds
      expect(result.estimatedTimeRange.min).toBe(5 * BLOCK_TIME_SECONDS)
      expect(result.estimatedTimeRange.max).toBe(10 * BLOCK_TIME_SECONDS)
    }
  })
})

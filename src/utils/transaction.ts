import { formatUnits } from 'viem'
import { BLOCK_TIME_SECONDS } from '../constants/config'
import type { GasEstimate } from '../types'

const LOCALE = 'en-US' as const

const removeTrailingZeros = (value: string): string => {
  return value.replace(/\.?0+$/, '')
}

export const formatEstimatedTime = (seconds: number): string => {
  if (seconds < 60) return `~${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `~${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `~${hours}h`
}

export const formatEstimatedTimeRange = (min: number, max: number): string => {
  const minFormatted = formatEstimatedTime(min)
  const maxFormatted = formatEstimatedTime(max)
  return `${minFormatted} - ${maxFormatted}`
}

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export const formatGasPrice = (gasPrice: string | bigint | undefined): string => {
  if (!gasPrice) return 'N/A'
  const wei = BigInt(gasPrice)
  const gweiValue = Number(wei) / 1e9
  const formatted = removeTrailingZeros(gweiValue.toFixed(9))
  return `${formatted} gwei`
}

export const formatGasUsed = (gasUsed: string | bigint | undefined): string => {
  if (!gasUsed) return 'N/A'
  const gas = BigInt(gasUsed)
  return gas.toLocaleString(LOCALE)
}

export const formatTotalGasFee = (totalGasFee: string | undefined): string => {
  if (!totalGasFee) return 'N/A'
  return `${totalGasFee} ETH`
}

/**
 * Estimates block range for transaction inclusion based on priority fee ratio.
 * Higher priority (ratio >= 2) = 1-2 blocks, lower priority = 5-10 blocks.
 */
export const estimateBlocksForInclusion = (
  maxPriorityFeePerGas: bigint,
  baseFeePerGas: bigint
): { min: number; max: number } => {
  const ratio = Number(maxPriorityFeePerGas) / Number(baseFeePerGas)

  if (ratio >= 2) {
    return { min: 1, max: 2 }
  }

  if (ratio >= 1.5) {
    return { min: 2, max: 3 }
  }

  if (ratio >= 1) {
    return { min: 3, max: 5 }
  }

  return { min: 5, max: 10 }
}

interface GasFeeData {
  baseFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  maxFeePerGas: bigint
  estimatedCost: bigint
}

/**
 * Formats gas estimation data including total cost and estimated time range.
 * @returns Formatted gas estimate or null if data is invalid.
 */
export const formatGasEstimate = (
  estimatedGas: bigint,
  feeData: GasFeeData | null
): GasEstimate | null => {
  if (!feeData || !estimatedGas) return null

  const totalCostWei = estimatedGas * feeData.estimatedCost
  const totalCostEth = formatUnits(totalCostWei, 18)

  const blocks = estimateBlocksForInclusion(
    feeData.maxPriorityFeePerGas,
    feeData.baseFeePerGas
  )
  const estimatedTimeRange = {
    min: blocks.min * BLOCK_TIME_SECONDS,
    max: blocks.max * BLOCK_TIME_SECONDS,
  }

  return {
    maxFeePerGas: feeData.maxFeePerGas,
    totalCost: totalCostEth,
    estimatedTimeRange,
  }
}

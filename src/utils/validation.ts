import { isAddress, getAddress } from 'viem'
import { MAX_INPUT_LENGTH, MAX_AMOUNT_LENGTH } from '../constants/config'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const isEmpty = (value: string): boolean => {
  return !value || value.trim() === ''
}

/**
 * Sanitizes address input by removing non-printable characters and enforcing max length.
 * Prevents XSS and injection attacks.
 */
export const sanitizeAddress = (input: string): string => {
  return input
    .trim()
    .slice(0, MAX_INPUT_LENGTH)
    .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
}

/**
 * Sanitizes amount input by removing non-numeric characters and normalizing decimals.
 * Prevents injection attacks and ensures valid numeric format.
 */
export const sanitizeAmount = (input: string): string => {
  return input
    .trim()
    .slice(0, MAX_AMOUNT_LENGTH)
    .replace(/[^\d.]/g, '') // Only allow digits and decimal point
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\./, '0.') // Ensure leading zero before decimal
}

/**
 * Validates Ethereum address format and checks for zero address.
 * @returns Validation result with error message if invalid.
 */
export const validateAddress = (address: string): { valid: boolean; error?: string } => {
  if (isEmpty(address)) {
    return { valid: false, error: 'Address is required' }
  }

  if (!isAddress(address)) {
    return { valid: false, error: 'Invalid Ethereum address' }
  }

  try {
    const normalized = getAddress(address)
    if (normalized === getAddress(ZERO_ADDRESS)) {
      return { valid: false, error: 'Cannot send to zero address' }
    }
  } catch {
    return { valid: false, error: 'Invalid Ethereum address' }
  }

  return { valid: true }
}

/**
 * Validates amount format, decimal places, and checks against balance.
 * Uses BigInt to avoid floating-point precision issues.
 * @returns Validation result with error message if invalid.
 */
export const validateAmount = (
  amount: string,
  balance: bigint,
  decimals: number
): { valid: boolean; error?: string } => {
  if (isEmpty(amount)) {
    return { valid: false, error: 'Amount is required' }
  }

  const [integerPart = '0', decimalPart = ''] = amount.split('.')

  if (!/^\d+$/.test(integerPart)) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }

  if (decimalPart && !/^\d+$/.test(decimalPart)) {
    return { valid: false, error: 'Invalid amount format' }
  }

  if (decimalPart.length > decimals) {
    return { valid: false, error: `Maximum ${decimals} decimal places allowed` }
  }

  try {
    const decimalPadded = decimalPart.padEnd(decimals, '0')
    const scale = 10n ** BigInt(decimals)
    const fractionalPart = decimalPadded ? BigInt(decimalPadded) : 0n
    const amountBigInt = BigInt(integerPart) * scale + fractionalPart

    if (amountBigInt === 0n) {
      return { valid: false, error: 'Amount must be greater than 0' }
    }

    if (amountBigInt > balance) {
      return { valid: false, error: 'Insufficient balance' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid amount' }
  }
}

/**
 * Validates that ETH balance is sufficient for gas fees.
 * @returns Validation result with error message if insufficient.
 */
export const validateGasBalance = (
  ethBalance: bigint,
  estimatedGasCost: bigint
): { valid: boolean; error?: string } => {
  if (ethBalance < estimatedGasCost) {
    return { valid: false, error: 'Insufficient ETH for gas fees' }
  }
  return { valid: true }
}

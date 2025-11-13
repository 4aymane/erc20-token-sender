import { isAddress, type Address } from 'viem'

/**
 * Safely converts a string to an Address type after validation.
 * Throws an error if the address is invalid.
 *
 * @param value - The address string to convert
 * @returns The validated Address
 * @throws Error if the address is invalid
 *
 * @example
 * ```typescript
 * const address = toAddress(token.address)
 * // Now safe to use as Address type
 * ```
 */
export const toAddress = (value: string): Address => {
  if (!isAddress(value)) {
    throw new Error(`Invalid address: ${value}`)
  }
  return value as Address
}

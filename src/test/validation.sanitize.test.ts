import { describe, it, expect } from 'vitest'
import { sanitizeAddress, sanitizeAmount } from '../utils/validation'
import { MAX_INPUT_LENGTH, MAX_AMOUNT_LENGTH } from '../constants/config'

describe('sanitizeAddress', () => {
  it('trims whitespace', () => {
    expect(sanitizeAddress('  0x123  ')).toBe('0x123')
    expect(sanitizeAddress('\n0x123\t')).toBe('0x123')
  })

  it('removes non-printable characters', () => {
    expect(sanitizeAddress('0x123\x00abc')).toBe('0x123abc')
    expect(sanitizeAddress('0x123\u0000def')).toBe('0x123def')
  })

  it('enforces max length', () => {
    const longAddress = '0x' + 'a'.repeat(MAX_INPUT_LENGTH + 10)
    expect(sanitizeAddress(longAddress).length).toBeLessThanOrEqual(MAX_INPUT_LENGTH)
  })

  it('preserves valid address characters', () => {
    const valid = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
    expect(sanitizeAddress(valid)).toBe(valid)
  })
})

describe('sanitizeAmount', () => {
  it('trims whitespace', () => {
    expect(sanitizeAmount('  1.5  ')).toBe('1.5')
    expect(sanitizeAmount('\n100\t')).toBe('100')
  })

  it('removes non-numeric characters except decimal point', () => {
    expect(sanitizeAmount('1a2b3')).toBe('123')
    expect(sanitizeAmount('1-2-3')).toBe('123')
  })

  it('handles leading decimal point', () => {
    expect(sanitizeAmount('.5')).toBe('0.5')
    expect(sanitizeAmount('.123')).toBe('0.123')
  })

  it('collapses multiple decimal points', () => {
    expect(sanitizeAmount('1..2')).toBe('1.2')
    expect(sanitizeAmount('1...2')).toBe('1.2')
  })

  it('enforces max length', () => {
    const longAmount = '1.' + '0'.repeat(MAX_AMOUNT_LENGTH + 10)
    expect(sanitizeAmount(longAmount).length).toBeLessThanOrEqual(MAX_AMOUNT_LENGTH)
  })

  it('preserves valid numeric input', () => {
    expect(sanitizeAmount('123.456')).toBe('123.456')
    expect(sanitizeAmount('1000')).toBe('1000')
    expect(sanitizeAmount('0.000001')).toBe('0.000001')
  })
})

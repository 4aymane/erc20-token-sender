import { describe, it, expect } from 'vitest'
import { validateAddress, validateAmount, validateGasBalance } from '../utils/validation'

describe('validateAddress', () => {
  it('rejects empty address', () => {
    expect(validateAddress('')).toEqual({ valid: false, error: 'Address is required' })
    expect(validateAddress('   ')).toEqual({ valid: false, error: 'Address is required' })
  })

  it('rejects invalid Ethereum addresses', () => {
    expect(validateAddress('0x123')).toEqual({
      valid: false,
      error: 'Invalid Ethereum address',
    })
    expect(validateAddress('not-an-address')).toEqual({
      valid: false,
      error: 'Invalid Ethereum address',
    })
  })

  it('rejects zero address', () => {
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    expect(validateAddress(zeroAddress)).toEqual({
      valid: false,
      error: 'Cannot send to zero address',
    })
  })

  it('accepts valid addresses in different formats', () => {
    const checksummed = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    const lowercase = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
    expect(validateAddress(checksummed)).toEqual({ valid: true })
    expect(validateAddress(lowercase)).toEqual({ valid: true })
  })
})

describe('validateAmount', () => {
  const decimals = 18
  const balance = BigInt('1000000000000000000') // 1 token

  it('rejects empty and zero amounts', () => {
    expect(validateAmount('', balance, decimals)).toEqual({
      valid: false,
      error: 'Amount is required',
    })
    expect(validateAmount('0', balance, decimals)).toEqual({
      valid: false,
      error: 'Amount must be greater than 0',
    })
    expect(validateAmount('0.0', balance, decimals)).toEqual({
      valid: false,
      error: 'Amount must be greater than 0',
    })
  })

  it('rejects amounts exceeding balance', () => {
    const tooMuch = '2.0'
    expect(validateAmount(tooMuch, balance, decimals)).toEqual({
      valid: false,
      error: 'Insufficient balance',
    })
  })

  it('rejects too many decimal places', () => {
    const tooManyDecimals = '0.1234567890123456789' // 19 decimals for 18-decimal token
    expect(validateAmount(tooManyDecimals, balance, decimals)).toEqual({
      valid: false,
      error: 'Maximum 18 decimal places allowed',
    })
  })

  it('accepts valid amounts within balance', () => {
    expect(validateAmount('0.5', balance, decimals)).toEqual({ valid: true })
    expect(validateAmount('1.0', balance, decimals)).toEqual({ valid: true })
    expect(validateAmount('0.000000000000000001', balance, decimals)).toEqual({
      valid: true,
    })
  })

  it('handles 6-decimal tokens correctly', () => {
    const usdcDecimals = 6
    const usdcBalance = BigInt('1000000') // 1 USDC
    expect(validateAmount('0.5', usdcBalance, usdcDecimals)).toEqual({ valid: true })
    expect(validateAmount('0.0000001', usdcBalance, usdcDecimals)).toEqual({
      valid: false,
      error: 'Maximum 6 decimal places allowed',
    })
  })

  it('rejects invalid format', () => {
    expect(validateAmount('abc', balance, decimals)).toEqual({
      valid: false,
      error: 'Amount must be greater than 0',
    })
    expect(validateAmount('-1', balance, decimals)).toEqual({
      valid: false,
      error: 'Amount must be greater than 0',
    })
  })
})

describe('validateGasBalance', () => {
  it('rejects when ETH balance is insufficient', () => {
    const ethBalance = BigInt('1000000000000000') // 0.001 ETH
    const gasCost = BigInt('2000000000000000') // 0.002 ETH
    expect(validateGasBalance(ethBalance, gasCost)).toEqual({
      valid: false,
      error: 'Insufficient ETH for gas fees',
    })
  })

  it('accepts when ETH balance is sufficient or equal to gas cost', () => {
    expect(
      validateGasBalance(BigInt('2000000000000000'), BigInt('1000000000000000'))
    ).toEqual({ valid: true })
    expect(
      validateGasBalance(BigInt('1000000000000000'), BigInt('1000000000000000'))
    ).toEqual({ valid: true })
  })
})

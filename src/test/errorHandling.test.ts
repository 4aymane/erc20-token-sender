import { describe, it, expect, vi } from 'vitest'
import { BaseError } from 'viem'
import {
  isUserCancellation,
  isNetworkError,
  isRateLimitError,
  shouldIgnoreError,
  getErrorReasonFromChain,
} from '../utils/errorHandling'

// Mock the broadcast function to avoid side effects
vi.mock('../services/transactionSync', () => ({
  broadcastErrorToast: vi.fn(),
}))

describe('isUserCancellation', () => {
  it('detects user cancellation errors', () => {
    expect(isUserCancellation({ name: 'UserRejectedRequestError' })).toBe(true)
    expect(isUserCancellation({ code: 4001 })).toBe(true)
    expect(isUserCancellation({ code: 'ACTION_REJECTED' })).toBe(true)
    expect(isUserCancellation({ name: 'SomeOtherError' })).toBe(false)
  })
})

describe('isNetworkError', () => {
  it('detects network errors', () => {
    expect(isNetworkError({ name: 'HttpRequestError' })).toBe(true)
    expect(isNetworkError({ name: 'WebSocketRequestError' })).toBe(true)
    expect(isNetworkError({ name: 'RpcRequestError' })).toBe(true)
    expect(isNetworkError({ code: -32603 })).toBe(true)
    expect(isNetworkError({ name: 'ValidationError' })).toBe(false)
  })
})

describe('isRateLimitError', () => {
  it('detects rate limit errors', () => {
    expect(isRateLimitError({ name: 'LimitExceededRpcError' })).toBe(true)
    expect(isRateLimitError({ code: 429 })).toBe(true)
    expect(isRateLimitError({ code: '429' })).toBe(true)
    expect(isRateLimitError({ name: 'SomeOtherError' })).toBe(false)
  })
})

describe('shouldIgnoreError', () => {
  it('ignores rate limit and network errors but not user cancellations', () => {
    expect(shouldIgnoreError({ name: 'LimitExceededRpcError' })).toBe(true)
    expect(shouldIgnoreError({ name: 'HttpRequestError' })).toBe(true)
    expect(shouldIgnoreError({ name: 'UserRejectedRequestError' })).toBe(false)
  })
})

describe('getErrorReasonFromChain', () => {
  it('extracts reason from BaseError', () => {
    const cause = new BaseError('Root cause')
    // @ts-expect-error - setting reason property for test
    cause.reason = 'insufficient funds'
    expect(getErrorReasonFromChain(cause)).toBe('insufficient funds')
  })

  it('returns undefined for errors without reason', () => {
    const error = { name: 'SomeError' }
    expect(getErrorReasonFromChain(error)).toBeUndefined()
  })

  it('handles nested BaseError with reason in cause', () => {
    const cause = new BaseError('Cause error')
    // @ts-expect-error - setting reason property for test
    cause.reason = 'execution reverted'
    const error = new BaseError('Main error', { cause })
    expect(getErrorReasonFromChain(error)).toBe('execution reverted')
  })
})

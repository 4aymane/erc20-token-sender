import { BaseError } from 'viem'
import { broadcastErrorToast } from '../services/transactionSync'

const isErrorObject = (error: unknown): error is Record<string, unknown> => {
  return error !== null && typeof error === 'object'
}

const getErrorName = (error: unknown): string | undefined => {
  if (error instanceof BaseError) {
    return error.name
  }
  if (isErrorObject(error) && 'name' in error && typeof error.name === 'string') {
    return error.name
  }
  return undefined
}

const hasErrorCode = (error: unknown, codes: (number | string)[]): boolean => {
  if (!isErrorObject(error) || !('code' in error)) return false
  const code = error.code
  return typeof code === 'number' || typeof code === 'string'
    ? codes.includes(code)
    : false
}

/**
 * Determines if an error should be ignored (rate limit or network errors).
 * These errors are transient and don't require user action.
 */
export const shouldIgnoreError = (error: unknown): boolean => {
  return isRateLimitError(error) || isNetworkError(error)
}

const formatErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Checks if error is a rate limit error (429 status code).
 */
export const isRateLimitError = (error: unknown): boolean => {
  const name = getErrorName(error)
  if (name === 'LimitExceededRpcError' || name === 'HttpRequestError') {
    return true
  }
  if (hasErrorCode(error, [429, '429'])) {
    return true
  }
  return false
}

/**
 * Extracts error reason from BaseError chain (error.cause.reason).
 * Used to display meaningful error messages to users.
 */
export const getErrorReasonFromChain = (error: unknown): string | undefined => {
  if (
    error instanceof BaseError &&
    'reason' in error &&
    typeof error.reason === 'string'
  ) {
    return error.reason
  }

  if (error instanceof BaseError && error.cause) {
    if (
      error.cause instanceof BaseError &&
      'reason' in error.cause &&
      typeof error.cause.reason === 'string'
    ) {
      return error.cause.reason
    }
    if (typeof error.cause === 'string') {
      return error.cause
    }
  }

  return undefined
}

/**
 * Checks if error is a user cancellation (wallet rejection).
 */
export const isUserCancellation = (error: unknown): boolean => {
  const name = getErrorName(error)
  if (name === 'UserRejectedRequestError' || name === 'ACTION_REJECTED') {
    return true
  }
  if (hasErrorCode(error, [4001, 'ACTION_REJECTED'])) {
    return true
  }
  return false
}

/**
 * Checks if error is a network/connection error (HTTP, WebSocket, RPC).
 */
export const isNetworkError = (error: unknown): boolean => {
  const name = getErrorName(error)
  if (
    name === 'HttpRequestError' ||
    name === 'WebSocketRequestError' ||
    name === 'RpcRequestError' ||
    name === 'SocketClosedError'
  ) {
    return true
  }
  if (hasErrorCode(error, [-32603, 'NETWORK_ERROR'])) {
    return true
  }
  return false
}

export const isTransactionNotFoundError = (error: unknown): boolean => {
  const name = getErrorName(error)
  if (name === 'TransactionNotFoundError') {
    return true
  }
  const message = formatErrorMessage(error)
  return message.includes('could not be found') && message.includes('Transaction')
}

export const isTimeoutError = (error: unknown): boolean => {
  const name = getErrorName(error)
  return name === 'WaitForTransactionReceiptTimeoutError' || name === 'TimeoutError'
}

export const handleTransactionError = (error: unknown) => {
  if (isUserCancellation(error)) {
    broadcastErrorToast('Transaction cancelled')
    return
  }

  if (isNetworkError(error)) {
    broadcastErrorToast('Network error. Please try again')
    return
  }

  const reason = getErrorReasonFromChain(error)
  const message = reason ? reason : 'Transaction failed'
  broadcastErrorToast(message)
}

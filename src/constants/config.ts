/**
 * Application configuration constants
 */

// Transaction Monitoring
export const TX_RECEIPT_TIMEOUT = 5 * 60_000 // 5 minutes (extended to trust Viem's built-in mechanisms)

// Gas Fees
export const GAS_FEES_STALE_TIME = 30000 // 30 seconds
export const GAS_FEES_CACHE_TIME = 60000 // 1 minute

// Blockchain
export const BLOCK_TIME_SECONDS = 12 // Sepolia average block time

// React Query
export const DEFAULT_QUERY_STALE_TIME = 5000 // 5 seconds
export const DEFAULT_QUERY_RETRY = 1

// UI
export const TOAST_DEFAULT_DURATION = 4000 // 4 seconds
export const TOAST_SUCCESS_DURATION = 3000 // 3 seconds
export const TOAST_ERROR_DURATION = 5000 // 5 seconds
export const TOAST_LONG_DURATION = 8000 // 8 seconds

// Validation
export const MAX_INPUT_LENGTH = 100
export const MAX_AMOUNT_LENGTH = 50

// Pagination
export const TRANSACTIONS_PER_PAGE = 20

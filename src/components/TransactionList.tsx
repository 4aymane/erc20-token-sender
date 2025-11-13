import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, Badge } from './ui'
import { TransactionCard } from './TransactionCard'
import { getAllTransactions } from '../services/transactionStorage'
import { useCrossTab } from '../hooks/useCrossTab'
import { capitalizeFirst } from '../utils/formatting'
import { TRANSACTIONS_PER_PAGE } from '../constants/config'
import type { Transaction, TransactionStatus } from '../types'
const FILTER_TABS: (TransactionStatus | 'all')[] = [
  'all',
  'pending',
  'confirmed',
  'replaced',
]

/**
 * Sorts transactions with pending ones first, then by timestamp (newest first).
 * This function is used within useMemo to prevent unnecessary re-sorting.
 */
const sortTransactions = (txs: Transaction[]): Transaction[] => {
  return [...txs].sort((a, b) => {
    // Pending transactions always first
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    // Otherwise sort by newest first
    return b.timestamp - a.timestamp
  })
}

export const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<TransactionStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  const loadTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const txs = await getAllTransactions()
      setTransactions(txs)
    } catch (error) {
      console.error('Failed to load transactions from storage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useCrossTab({
    onTransactionAdded: (transaction) => {
      setTransactions((prev) => {
        if (prev.some((tx) => tx.hash === transaction.hash)) {
          return prev
        }
        return [transaction, ...prev]
      })
    },
    onTransactionUpdated: (hash, updates) => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.hash === hash ? { ...tx, ...updates } : tx))
      )
    },
  })

  const sortedTransactions = useMemo(() => {
    return sortTransactions(transactions)
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((tx) => {
      return filter === 'all' ? true : tx.status === filter
    })
  }, [sortedTransactions, filter])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE)
  }, [filteredTransactions.length])

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(
      currentPage * TRANSACTIONS_PER_PAGE,
      (currentPage + 1) * TRANSACTIONS_PER_PAGE
    )
  }, [filteredTransactions, currentPage])

  const pendingCount = useMemo(() => {
    return sortedTransactions.filter((tx) => tx.status === 'pending').length
  }, [sortedTransactions])

  useEffect(() => {
    setCurrentPage(0)
  }, [filter])

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">Loading transactions...</div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
        {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {FILTER_TABS.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {capitalizeFirst(status)}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">
            {filter === 'all' ? 'No transactions yet' : `No ${filter} transactions`}
          </p>
          <p className="text-sm text-gray-400">Send your first token to get started</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedTransactions.map((tx) => (
              <TransactionCard key={tx.hash} transaction={tx} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Transaction } from '../types'

interface TransactionDB extends DBSchema {
  transactions: {
    key: string
    value: Transaction
  }
}

const DB_NAME = 'erc20-token-sender'
const DB_VERSION = 1
const STORE_NAME = 'transactions'

let dbInstance: IDBPDatabase<TransactionDB> | null = null

const getDB = async (): Promise<IDBPDatabase<TransactionDB>> => {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<TransactionDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'hash' })
    },
  })

  return dbInstance
}

/**
 * Saves a transaction to IndexedDB for persistence across sessions.
 */
export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  const db = await getDB()
  await db.put(STORE_NAME, transaction)
}

/**
 * Retrieves all transactions from IndexedDB.
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = await getDB()
  return await db.getAll(STORE_NAME)
}

/**
 * Retrieves a single transaction by hash from IndexedDB.
 */
export const getTransaction = async (hash: string): Promise<Transaction | undefined> => {
  const db = await getDB()
  return await db.get(STORE_NAME, hash)
}

/**
 * Updates an existing transaction in IndexedDB with partial data.
 */
export const updateTransaction = async (
  hash: string,
  updates: Partial<Transaction>
): Promise<void> => {
  const db = await getDB()
  const existing = await db.get(STORE_NAME, hash)

  if (existing) {
    const merged = { ...existing, ...updates }
    await db.put(STORE_NAME, merged)
  } else {
    console.warn(`[TX_STORAGE] Attempted to update non-existent transaction: ${hash}`)
  }
}

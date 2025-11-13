export type TransactionStatus = 'pending' | 'confirmed' | 'replaced'

export interface Transaction {
  hash: string
  chainId: number
  status: TransactionStatus
  tokenAddress: string
  tokenSymbol: string
  tokenDecimals: number
  amount: string
  recipient: string
  timestamp: number
  gasUsed?: string
  effectiveGasPrice?: string
  totalGasFee?: string
  replacedTransactionHash?: string | null
  nonce?: number
  errorMessage?: string
}

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  verified?: boolean
}

export interface GasEstimate {
  maxFeePerGas: bigint
  totalCost: string
  estimatedTimeRange: { min: number; max: number }
}

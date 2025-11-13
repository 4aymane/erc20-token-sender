import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { ERC20_ABI } from '../constants/erc20'
import { isRateLimitError } from '../utils/errorHandling'
import { toAddress } from '../utils/address'
import { GAS_FEES_STALE_TIME, GAS_FEES_CACHE_TIME } from '../constants/config'
import type { Token, GasEstimate } from '../types'
import type { Address } from 'viem'
import { formatGasEstimate } from '../utils/transaction'

interface UseTransactionGasProps {
  enabled: boolean
  freeze?: boolean
  token: Token | null
  recipient: string | undefined
  amount: bigint
  userAddress: Address | undefined
}

interface TransactionGasData {
  contractGasEstimate: bigint | null
  baseFeePerGas: bigint | null
  maxPriorityFeePerGas: bigint | null
  maxFeePerGas: bigint | null
  gasEstimate: GasEstimate | null
}

/**
 * Fetches gas estimation and network fee data for ERC20 transfers.
 *
 * @param enabled - Whether the query should run
 * @param freeze - When true, prevents refetching (used during tx submission)
 * @param token - ERC20 token to estimate gas for
 * @param recipient - Recipient address for the transfer
 * @param amount - Amount to transfer (in token's smallest unit)
 * @param userAddress - Address of the sender
 * @returns Gas estimation data including contract gas, fees, and formatted estimate
 */
export const useTransactionGas = ({
  enabled,
  freeze = false,
  token,
  recipient,
  amount,
  userAddress,
}: UseTransactionGasProps) => {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: [
      'transaction-gas',
      publicClient?.chain?.id,
      token?.address,
      recipient,
      amount.toString(),
      userAddress,
    ],
    queryFn: async (): Promise<TransactionGasData> => {
      if (!publicClient || !token || !recipient || amount === 0n || !userAddress) {
        return {
          contractGasEstimate: null,
          baseFeePerGas: null,
          maxPriorityFeePerGas: null,
          maxFeePerGas: null,
          gasEstimate: null,
        }
      }

      try {
        const [contractGas, fees, latestBlock] = await Promise.all([
          publicClient.estimateContractGas({
            address: toAddress(token.address),
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [toAddress(recipient), amount],
            account: userAddress,
          }),
          publicClient.estimateFeesPerGas(),
          publicClient.getBlock({ blockTag: 'latest' }),
        ])

        if (
          !fees.maxFeePerGas ||
          !fees.maxPriorityFeePerGas ||
          !latestBlock.baseFeePerGas
        ) {
          return {
            contractGasEstimate: contractGas,
            baseFeePerGas: null,
            maxPriorityFeePerGas: null,
            maxFeePerGas: null,
            gasEstimate: null,
          }
        }

        const baseFeePerGas = latestBlock.baseFeePerGas
        const maxPriorityFeePerGas = fees.maxPriorityFeePerGas
        const maxFeePerGas = fees.maxFeePerGas
        const estimatedCost = baseFeePerGas + maxPriorityFeePerGas

        const gasEstimate = formatGasEstimate(contractGas, {
          baseFeePerGas,
          maxPriorityFeePerGas,
          maxFeePerGas,
          estimatedCost,
        })

        return {
          contractGasEstimate: contractGas,
          baseFeePerGas,
          maxPriorityFeePerGas,
          maxFeePerGas,
          gasEstimate,
        }
      } catch (error) {
        if (isRateLimitError(error)) {
          return {
            contractGasEstimate: null,
            baseFeePerGas: null,
            maxPriorityFeePerGas: null,
            maxFeePerGas: null,
            gasEstimate: null,
          }
        }
        return {
          contractGasEstimate: null,
          baseFeePerGas: null,
          maxPriorityFeePerGas: null,
          maxFeePerGas: null,
          gasEstimate: null,
        }
      }
    },
    enabled:
      enabled &&
      Boolean(publicClient) &&
      Boolean(token) &&
      Boolean(recipient) &&
      amount > 0n &&
      Boolean(userAddress) &&
      !freeze,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: freeze ? Infinity : GAS_FEES_STALE_TIME,
    gcTime: GAS_FEES_CACHE_TIME,
    retry: (failureCount, error) => {
      if (isRateLimitError(error)) {
        return false
      }
      return failureCount < 2
    },
  })
}

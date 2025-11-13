import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAccount, useWriteContract, useBalance } from 'wagmi'
import { parseUnits } from 'viem'
import { Card, Input, Button, Alert } from './ui'
import { TokenSelector } from './TokenSelector'
import { ERC20_ABI } from '../constants/erc20'
import {
  validateAddress,
  validateAmount,
  validateGasBalance,
  sanitizeAddress,
  sanitizeAmount,
} from '../utils/validation'
import { formatTokenAmount } from '../utils/formatting'
import { formatEstimatedTimeRange } from '../utils/transaction'
import { handleTransactionError } from '../utils/errorHandling'
import { toAddress } from '../utils/address'
import { useTransactionGas } from '../hooks/useTransactionGas'
import { useTransactionSave } from '../hooks/useTransactionSave'
import { useDebounce } from '../hooks/useDebounce'
import type { Token } from '../types'
import type { Address } from 'viem'

export const TransferForm = () => {
  const { address: userAddress } = useAccount()
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounce inputs to prevent excessive gas API calls
  const debouncedRecipient = useDebounce(recipient, 500)
  const debouncedAmount = useDebounce(amount, 500)

  const { data: ethBalance } = useBalance({
    address: userAddress,
  })

  const { data: tokenBalance } = useBalance({
    address: userAddress,
    token: selectedToken ? toAddress(selectedToken.address) : undefined,
    query: { enabled: Boolean(selectedToken) },
  })

  const parsedAmount = useMemo(() => {
    if (!amount || !selectedToken) return 0n
    try {
      return parseUnits(amount, selectedToken.decimals)
    } catch {
      return 0n
    }
  }, [amount, selectedToken])

  const debouncedParsedAmount = useMemo(() => {
    if (!debouncedAmount || !selectedToken) return 0n
    try {
      return parseUnits(debouncedAmount, selectedToken.decimals)
    } catch {
      return 0n
    }
  }, [debouncedAmount, selectedToken])

  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract()

  const shouldFreezeGas = isSubmitting || isPending

  const isGasEstimationReady = Boolean(
    selectedToken && debouncedRecipient && debouncedParsedAmount > 0n
  )

  const {
    data: gasData,
    isLoading: isGasLoading,
    isFetching: isGasFetching,
  } = useTransactionGas({
    enabled: isGasEstimationReady,
    freeze: shouldFreezeGas,
    token: selectedToken,
    recipient: debouncedRecipient || undefined,
    amount: debouncedParsedAmount,
    userAddress: userAddress as Address | undefined,
  })

  const addressValidation = validateAddress(recipient)
  const amountValidation =
    selectedToken && tokenBalance
      ? validateAmount(amount, tokenBalance.value, selectedToken.decimals)
      : { valid: false, error: 'Select a token first' }

  const gasValidation =
    gasData?.contractGasEstimate && gasData?.maxFeePerGas && ethBalance
      ? validateGasBalance(
          ethBalance.value,
          gasData.contractGasEstimate * gasData.maxFeePerGas
        )
      : { valid: true }

  const isValid =
    addressValidation.valid &&
    amountValidation.valid &&
    gasValidation.valid &&
    selectedToken

  const gasEstimate = gasData?.gasEstimate || null
  const isGasEstimating = isGasLoading || isGasFetching
  const isGasRefreshing = isGasFetching && gasEstimate !== null

  useEffect(() => {
    if (!isPending && !txHash && isSubmitting) {
      setIsSubmitting(false)
    }
  }, [isPending, txHash, isSubmitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !selectedToken || !userAddress) return

    setIsSubmitting(true)

    try {
      await writeContractAsync({
        address: toAddress(selectedToken.address),
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [toAddress(recipient), parsedAmount],
        ...(gasData?.maxFeePerGas &&
          gasData?.maxPriorityFeePerGas && {
            maxFeePerGas: gasData.maxFeePerGas,
            maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
          }),
      })
    } catch (submitError) {
      setIsSubmitting(false)
      handleTransactionError(submitError)
    }
  }

  const handleTransactionSuccess = useCallback(() => {
    setRecipient('')
    setAmount('')
    setIsSubmitting(false)
  }, [])

  useTransactionSave({
    txHash,
    selectedToken,
    amount,
    recipient,
    error,
    onSuccess: handleTransactionSuccess,
  })

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Tokens</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Token Selector */}
        <TokenSelector selectedToken={selectedToken} onTokenSelect={setSelectedToken} />

        {/* Recipient Address */}
        <Input
          label="Recipient Address"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(sanitizeAddress(e.target.value))}
          error={
            recipient && !addressValidation.valid ? addressValidation.error : undefined
          }
          disabled={!selectedToken}
        />

        {/* Amount */}
        <Input
          label="Amount"
          type="text"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
          error={amount && !amountValidation.valid ? amountValidation.error : undefined}
          disabled={!selectedToken}
          rightElement={
            tokenBalance && selectedToken ? (
              <button
                type="button"
                onClick={() =>
                  setAmount(formatTokenAmount(tokenBalance.value, selectedToken.decimals))
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                MAX
              </button>
            ) : undefined
          }
        />

        {/* Gas Estimate */}
        {isGasEstimating && !gasEstimate ? (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Gas Cost:</span>
              <span className="font-medium text-gray-400 animate-pulse">
                Calculating...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">First Confirmation:</span>
              <span className="font-medium text-gray-400 animate-pulse">—</span>
            </div>
          </div>
        ) : gasEstimate ? (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Gas Cost:</span>
              <span className="font-medium flex items-center gap-1.5">
                {isGasRefreshing && (
                  <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
                ~{gasEstimate.totalCost} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">First Confirmation:</span>
              <span className="font-medium">
                {formatEstimatedTimeRange(
                  gasEstimate.estimatedTimeRange.min,
                  gasEstimate.estimatedTimeRange.max
                )}
              </span>
            </div>
          </div>
        ) : null}

        {/* Validation Errors */}
        {!gasValidation.valid && <Alert variant="danger">{gasValidation.error}</Alert>}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isValid || isSubmitting || isPending}
          isLoading={isSubmitting || isPending}
          className="w-full"
        >
          {isSubmitting || isPending ? 'Sending...' : 'Send Tokens'}
        </Button>
      </form>
    </Card>
  )
}

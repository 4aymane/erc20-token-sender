import { useState } from 'react'
import { Card, Badge, ExternalLink } from './ui'
import { shortenAddress, copyToClipboard, getExplorerUrl } from '../utils/formatting'
import {
  formatDateTime,
  formatGasPrice,
  formatGasUsed,
  formatTotalGasFee,
} from '../utils/transaction'
import type { Transaction, TransactionStatus } from '../types'
import type { BadgeProps } from './ui/Badge'

type BadgeVariant = NonNullable<BadgeProps['variant']>

interface StatusConfig {
  variant: BadgeVariant
  label: string
  icon: string
}

const TRANSACTION_STATUS_CONFIG: Record<TransactionStatus, StatusConfig> = {
  pending: {
    variant: 'warning',
    label: 'Pending',
    icon: '⏳',
  },
  confirmed: {
    variant: 'success',
    label: 'Confirmed',
    icon: '✓',
  },
  replaced: {
    variant: 'info',
    label: 'Replaced',
    icon: '↻',
  },
}

const getStatusConfig = (status: TransactionStatus): StatusConfig => {
  return TRANSACTION_STATUS_CONFIG[status]
}

interface TransactionCardProps {
  transaction: Transaction
}

interface CopyableAddressProps {
  label: string
  value: string
  copyType: string
  copied: string | null
  onCopy: (text: string, type: string) => void
  chars?: number
}

const CopyableAddress = ({
  label,
  value,
  copyType,
  copied,
  onCopy,
  chars = 8,
}: CopyableAddressProps) => (
  <div>
    <span className="text-gray-500">{label}:</span>
    <div className="flex items-center gap-2 mt-1">
      <code className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
        {shortenAddress(value, chars)}
      </code>
      <button
        onClick={() => onCopy(value, copyType)}
        className="text-blue-600 hover:text-blue-800 text-xs"
        title={`Copy ${label.toLowerCase()}`}
      >
        {copied === copyType ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  </div>
)

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(transaction.status !== 'replaced')
  const [copied, setCopied] = useState<string | null>(null)
  const status = getStatusConfig(transaction.status)

  const handleCopy = async (text: string, type: string) => {
    await copyToClipboard(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Card
      hover
      className={`transition-all ${
        transaction.status === 'replaced' ? 'opacity-75 bg-gray-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge
              variant={status.variant}
              className={transaction.status === 'pending' ? 'animate-pulse' : ''}
            >
              {status.icon} {status.label}
            </Badge>
            {transaction.status === 'pending' && (
              <span className="inline-block w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {transaction.amount} {transaction.tokenSymbol}
              </span>
              <span className="text-gray-500">→</span>
              <button
                onClick={() => handleCopy(transaction.recipient, 'recipient')}
                className="text-gray-600 font-mono hover:text-blue-600 transition-colors text-sm"
                title={transaction.recipient}
              >
                {shortenAddress(transaction.recipient)}
                {copied === 'recipient' && (
                  <span className="ml-1 text-xs text-green-600">✓</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span>{formatDateTime(transaction.timestamp)}</span>
              {transaction.nonce !== undefined && <span>Nonce: {transaction.nonce}</span>}
              {transaction.totalGasFee ? (
                <span>Gas Fee: {formatTotalGasFee(transaction.totalGasFee)}</span>
              ) : transaction.effectiveGasPrice ? (
                <span>Gas: {formatGasPrice(transaction.effectiveGasPrice)}</span>
              ) : null}
            </div>

            {transaction.errorMessage && (
              <div
                className={`text-xs mt-2 p-2 rounded border ${
                  transaction.status === 'replaced'
                    ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-red-600 bg-red-50 border-red-200'
                }`}
              >
                {transaction.errorMessage}
              </div>
            )}

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs">
                <div className="grid grid-cols-1 gap-2">
                  <CopyableAddress
                    label="Transaction Hash"
                    value={transaction.hash}
                    copyType="hash"
                    copied={copied}
                    onCopy={handleCopy}
                  />

                  <CopyableAddress
                    label="Recipient"
                    value={transaction.recipient}
                    copyType="recipient-full"
                    copied={copied}
                    onCopy={handleCopy}
                  />

                  {transaction.totalGasFee ? (
                    <>
                      <div>
                        <span className="text-gray-500">Gas Used:</span>
                        <span className="ml-2 text-gray-700">
                          {formatGasUsed(transaction.gasUsed)} gas
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Effective Gas Price:</span>
                        <span className="ml-2 text-gray-700">
                          {formatGasPrice(transaction.effectiveGasPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Gas Fee:</span>
                        <span className="ml-2 text-gray-700 font-semibold">
                          {formatTotalGasFee(transaction.totalGasFee)}
                        </span>
                      </div>
                    </>
                  ) : transaction.effectiveGasPrice ? (
                    <div>
                      <span className="text-gray-500">Effective Gas Price:</span>
                      <span className="ml-2 text-gray-700">
                        {formatGasPrice(transaction.effectiveGasPrice)}
                      </span>
                    </div>
                  ) : null}

                  {transaction.replacedTransactionHash && (
                    <CopyableAddress
                      label="Replacement Transaction"
                      value={transaction.replacedTransactionHash}
                      copyType="replaced-tx"
                      copied={copied}
                      onCopy={handleCopy}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <ExternalLink
            href={getExplorerUrl(
              'tx',
              transaction.replacedTransactionHash || transaction.hash
            )}
            variant="primary"
            className="text-xs whitespace-nowrap"
          >
            View on Etherscan
          </ExternalLink>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
          >
            {isExpanded ? '▲ Less' : '▼ More'}
          </button>
        </div>
      </div>
    </Card>
  )
}

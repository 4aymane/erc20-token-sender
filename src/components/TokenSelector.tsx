import { useBalance, useAccount } from 'wagmi'
import { ExternalLink, Badge } from './ui'
import { SEPOLIA_TOKENS } from '../constants/tokens'
import { formatTokenAmount, getExplorerUrl } from '../utils/formatting'
import { toAddress } from '../utils/address'
import type { Token } from '../types'

interface TokenSelectorProps {
  selectedToken: Token | null
  onTokenSelect: (token: Token) => void
}

export const TokenSelector = ({ selectedToken, onTokenSelect }: TokenSelectorProps) => {
  const { address: userAddress } = useAccount()

  const { data: balance } = useBalance({
    address: userAddress,
    token: selectedToken ? toAddress(selectedToken.address) : undefined,
    query: { enabled: Boolean(selectedToken && userAddress) },
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Token
        </label>

        {/* Predefined Tokens */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {SEPOLIA_TOKENS.map((token) => (
            <button
              key={token.address}
              onClick={() => onTokenSelect(token)}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${
                  selectedToken?.address.toLowerCase() === token.address.toLowerCase()
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="font-semibold text-gray-900">{token.symbol}</div>
              <div className="text-xs text-gray-500">{token.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Token Info */}
      {selectedToken && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">{selectedToken.symbol}</span>
            <Badge variant={selectedToken.verified ? 'success' : 'warning'}>
              {selectedToken.verified ? '✓ Verified' : '⚠ Unverified'}
            </Badge>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              Balance:{' '}
              {balance ? formatTokenAmount(balance.value, selectedToken.decimals) : '0'}{' '}
              {selectedToken.symbol}
            </div>
            <ExternalLink
              href={getExplorerUrl('address', selectedToken.address)}
              variant="subtle"
              className="text-sm"
            >
              View Contract
            </ExternalLink>
          </div>
        </div>
      )}
    </div>
  )
}

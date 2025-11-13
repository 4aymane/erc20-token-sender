import { formatUnits } from 'viem'
import { SEPOLIA_EXPLORER_URL } from '../constants/tokens'

const LOCALE = 'en-US' as const

export const capitalizeFirst = (str: string): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export const formatTokenAmount = (
  amount: bigint | string,
  decimals: number,
  maxDecimals = 6
): string => {
  const formatted = formatUnits(BigInt(amount), decimals)
  const num = parseFloat(formatted)

  if (num === 0) return '0'
  if (num < 0.000001) return '< 0.000001'

  return num.toLocaleString(LOCALE, {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  })
}

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

export const getExplorerUrl = (
  type: 'tx' | 'address' | 'token',
  value: string
): string => {
  return `${SEPOLIA_EXPLORER_URL}/${type}/${value}`
}

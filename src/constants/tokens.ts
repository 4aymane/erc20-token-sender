import type { Token } from '../types'

export const WEI_PER_ETH = 10n ** 18n

export const SEPOLIA_TOKENS: Token[] = [
  {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    verified: true,
  },
  {
    address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    verified: true,
  },
  {
    address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    symbol: 'LINK',
    name: 'Chainlink Token',
    decimals: 18,
    verified: true,
  },
]

export const SEPOLIA_EXPLORER_URL = 'https://sepolia.etherscan.io'

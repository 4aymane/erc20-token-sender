# ERC20 Token Sender

Send ERC20 tokens on Sepolia testnet with transaction tracking and cross-tab synchronization.

**Kleros Fullstack/Web3 Developer Assessment - Exercise L**

## Features

- Send ERC20 tokens with gas estimation and time estimates
- Real-time transaction status tracking (pending → confirmed/replaced)
- Persistent transaction history (IndexedDB)
- Cross-tab synchronization (BroadcastChannel)
- Transaction replacement detection (speed-up support)
- Read-only mode with user-initiated wallet connection
- Input validation & sanitization (address, amount, gas balance)
- Comprehensive error handling with user-friendly messages
- Toast notifications for transaction events
- Network validation (Sepolia only)
- Performance optimizations (debouncing, caching, page visibility API)

## Tech Stack

React 19, TypeScript, Vite, RainbowKit, Wagmi v2, Viem, TailwindCSS, IndexedDB

## Setup

```bash
npm install
npm run dev
```

Create `.env`:

```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

Get your WalletConnect Project ID at [WalletConnect Cloud](https://cloud.walletconnect.com/) (free).

## Supported Tokens

- USDC (USD Coin)
- DAI (Dai Stablecoin)
- LINK (Chainlink Token)

All tokens are on Sepolia testnet.

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run tests
npm run test:ui  # Run tests with UI
```

## Project Structure

```
src/
├── components/  # UI components (Atomic Design)
├── hooks/       # Custom React hooks
├── services/    # IndexedDB storage & cross-tab sync
├── utils/       # Validation, formatting, ERC20 ABI
├── types/       # TypeScript definitions
└── constants/  # Chain & token configuration
```

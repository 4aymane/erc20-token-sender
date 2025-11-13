import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { TransferForm } from './components/TransferForm'
import { TransactionList } from './components/TransactionList'
import { useTransactionMonitor } from './hooks/useTransactionMonitor'
import { useCrossTab } from './hooks/useCrossTab'
import { Alert, InfoBox } from './components/ui'

function App() {
  const { isConnected, chain } = useAccount()

  useTransactionMonitor()
  useCrossTab({ enableToasts: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">ERC20 Token Sender</h1>
            {chain && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                {chain.name}
              </span>
            )}
          </div>
          {isConnected && <ConnectButton />}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isConnected ? (
          <>
            {/* Wrong Network Warning */}
            {chain?.id !== sepolia.id && (
              <Alert variant="warning" className="mb-6">
                <p className="font-semibold">Wrong Network</p>
                <p>Please switch to Sepolia testnet to use this app.</p>
              </Alert>
            )}

            {/* Transfer Form */}
            <div className="mb-8">
              <TransferForm />
            </div>

            {/* Transaction History */}
            <TransactionList />
          </>
        ) : (
          /* Welcome Screen */
          <div className="text-center py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to ERC20 Token Sender
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Send ERC20 tokens on Sepolia testnet with ease
              </p>
              <p className="text-sm text-gray-500">
                Modern wallet integration • Transaction tracking • Cross-tab sync
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <ConnectButton />
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <InfoBox
                  icon="🔐"
                  title="Secure"
                  description="Modern wallet integration with RainbowKit"
                />
                <InfoBox
                  icon="⚡"
                  title="Fast"
                  description="Real-time transaction monitoring"
                />
                <InfoBox
                  icon="🔄"
                  title="Synced"
                  description="Cross-tab synchronization"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 text-center text-xs text-gray-500 border-t border-gray-200">
        <p className="mb-1">Kleros Fullstack/Web3 Developer Assessment - Exercise L</p>
        <p className="text-gray-400">
          Modern wallet integration (RainbowKit + Wagmi) • Modular components • IndexedDB
          persistence
        </p>
      </footer>
    </div>
  )
}

export default App

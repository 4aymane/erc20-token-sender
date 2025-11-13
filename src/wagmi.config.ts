import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'

// Validate required environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId || projectId === 'YOUR_PROJECT_ID' || projectId === 'your_project_id') {
  throw new Error(
    'VITE_WALLETCONNECT_PROJECT_ID is not configured. ' +
      'Please add it to your .env file. ' +
      'Get your Project ID at https://cloud.walletconnect.com/'
  )
}

export const config = getDefaultConfig({
  appName: 'ERC20 Token Sender',
  projectId,
  chains: [sepolia],
  ssr: false,
})

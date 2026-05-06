import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from 'viem'

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
})

const projectId = '75ee11fcb268a9ce1df27d9fe935cff2'

const metadata = {
  name: 'ArcPredict',
  description: 'Prediction Market on Arc Testnet',
  url: 'https://arc-predict-market--ezeh1595.replit.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

const networks = [arcTestnet]

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
  },
})

const queryClient = new QueryClient()

export function WalletConnect({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <appkit-button />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export function ConnectButton() {
  return <appkit-button />
}
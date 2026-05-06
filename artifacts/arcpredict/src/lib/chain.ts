import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.testnet.arc.network" },
  },
});

const projectId = "75ee11fcb268a9ce1df27d9fe935cff2";

export const wagmiAdapter = new WagmiAdapter({
  networks: [arcTestnet],
  projectId,
});

// Must be called from @reown/appkit/react so getAppKit(modal) registers the React context
createAppKit({
  adapters: [wagmiAdapter],
  networks: [arcTestnet],
  defaultNetwork: arcTestnet,
  projectId,
  metadata: {
    name: "ArcPredict",
    description: "Prediction markets on Arc Testnet",
    url: typeof window !== "undefined" ? window.location.origin : "",
    icons: [],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "hsl(190 90% 50%)",
    "--w3m-border-radius-master": "2px",
    "--w3m-font-family": "'JetBrains Mono', 'Menlo', monospace",
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

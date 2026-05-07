import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createWalletClient, custom } from "viem";
import { arcTestnet, ARC_CHAIN_ID, ARC_CHAIN_ID_HEX } from "@/lib/chain";

// Extend Window to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

type WalletContextType = {
  address: `0x${string}` | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongChain: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: () => Promise<void>;
  getWalletClient: () => ReturnType<typeof createWalletClient> | null;
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  isWrongChain: false,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
  getWalletClient: () => null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!address;
  const isWrongChain = isConnected && chainId !== ARC_CHAIN_ID;

  const getWalletClient = useCallback((): ReturnType<typeof createWalletClient> | null => {
    if (!window.ethereum || !address) return null;
    return createWalletClient({
      account: address,
      chain: arcTestnet,
      transport: custom(window.ethereum),
    });
  }, [address]);

  const switchChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN_ID_HEX }],
      });
    } catch (err: any) {
      // Chain not added yet — add it
      if (err?.code === 4902 || err?.code === -32603) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: ARC_CHAIN_ID_HEX,
              chainName: "Arc Testnet",
              rpcUrls: ["https://rpc.testnet.arc.network"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://explorer.testnet.arc.network"],
            },
          ],
        });
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("No wallet detected.\n\nPlease install MetaMask or use a Web3 browser like Mises.");
      return;
    }
    setIsConnecting(true);
    try {
      // This triggers the MetaMask / wallet popup
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts[0]) {
        setAddress(accounts[0] as `0x${string}`);

        // Read current chain
        const chainHex = (await window.ethereum.request({
          method: "eth_chainId",
        })) as string;
        const currentChainId = parseInt(chainHex, 16);
        setChainId(currentChainId);

        // Auto-switch to Arc Testnet
        if (currentChainId !== ARC_CHAIN_ID) {
          await switchChain();
        }
      }
    } catch (err: any) {
      // User rejected or error
      console.warn("Wallet connect error:", err?.message ?? err);
    } finally {
      setIsConnecting(false);
    }
  }, [switchChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  // Restore session and listen for chain/account changes
  useEffect(() => {
    if (!window.ethereum) return;

    // Check if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        const list = accounts as string[];
        if (list[0]) {
          setAddress(list[0] as `0x${string}`);
          const chainHex = (await window.ethereum!.request({
            method: "eth_chainId",
          })) as string;
          setChainId(parseInt(chainHex, 16));
        }
      })
      .catch(() => {});

    const onAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      setAddress((list[0] as `0x${string}`) ?? null);
      if (!list[0]) setChainId(null);
    };

    const onChainChanged = (chainHex: unknown) => {
      setChainId(parseInt(chainHex as string, 16));
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener("chainChanged", onChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnected,
        isConnecting,
        isWrongChain,
        connect,
        disconnect,
        switchChain,
        getWalletClient,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

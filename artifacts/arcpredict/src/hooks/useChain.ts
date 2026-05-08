import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { publicClient, arcTestnet } from "@/lib/chain";
import { useWallet } from "@/lib/wallet";
import { createWalletClient, custom, decodeAbiParameters, encodeAbiParameters } from "viem";
import {
  FACTORY_ABI,
  MARKET_ABI,
  ERC20_ABI,
  MARKET_FACTORY_ADDRESS,
  USDC_ADDRESS,
  fromUsdc,
  toUsdc,
} from "@/lib/contracts";

export type ChainMarket = {
  address: `0x${string}`;
  question: string;
  endTime: bigint;
  yesToken: `0x${string}`;
  noToken: `0x${string}`;
  totalYes: bigint;
  totalNo: bigint;
  yesWon: boolean;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  status: "open" | "ended" | "resolved_yes" | "resolved_no";
};

function computePrices(totalYes: bigint, totalNo: bigint) {
  const y = Number(totalYes);
  const n = Number(totalNo);
  if (y + n === 0) return { yesPrice: 0.5, noPrice: 0.5 };
  return { yesPrice: y / (y + n), noPrice: n / (y + n) };
}

function computeStatus(endTime: bigint, yesWon: boolean): ChainMarket["status"] {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (endTime > now) return "open";
  if (yesWon) return "resolved_yes";
  return "ended";
}

// ── Raw selectors confirmed via direct RPC against the deployed contracts ──
// Factory
const SEL_GET_ALL_MARKETS = "0xb0772d0b" as const;
const SEL_GET_MARKET_COUNT = "0xfd69f3c2" as const;
// Market
const SEL_QUESTION  = "0x3fad9ae0" as const;
const SEL_END_TIME  = "0x3197cbb6" as const;
const SEL_TOTAL_YES = "0x88ba8dd6" as const;
const SEL_TOTAL_NO  = "0xaf008883" as const;
const SEL_YES_TOKEN = "0x11a9f10a" as const;
const SEL_NO_TOKEN  = "0xf0d9bb20" as const;
const SEL_YES_WON   = "0xcbee38dc" as const;
// ERC-20
const SEL_BALANCE_OF = "0x70a08231" as const;
const SEL_ALLOWANCE  = "0xdd62ed3e" as const;

// Low-level helper: call with a known selector + optional ABI-encoded params
async function rawCall(
  to: `0x${string}`,
  selector: `0x${string}`,
  paramTypes: Parameters<typeof encodeAbiParameters>[0] = [],
  params: Parameters<typeof encodeAbiParameters>[1] = []
): Promise<`0x${string}` | null> {
  try {
    const encoded =
      paramTypes.length > 0
        ? encodeAbiParameters(paramTypes, params).slice(2)
        : "";
    const result = await publicClient.call({
      to,
      data: `${selector}${encoded}` as `0x${string}`,
    });
    return result.data && result.data !== "0x" ? result.data : null;
  } catch {
    return null;
  }
}

// Fetch all fields for a single market address
async function fetchMarket(addr: `0x${string}`): Promise<ChainMarket | null> {
  try {
    const [qRes, etRes, tyRes, tnRes, ytRes, ntRes, ywRes] = await Promise.all([
      rawCall(addr, SEL_QUESTION),
      rawCall(addr, SEL_END_TIME),
      rawCall(addr, SEL_TOTAL_YES),
      rawCall(addr, SEL_TOTAL_NO),
      rawCall(addr, SEL_YES_TOKEN),
      rawCall(addr, SEL_NO_TOKEN),
      rawCall(addr, SEL_YES_WON),
    ]);

    if (!qRes || !etRes) return null;

    const [question]  = decodeAbiParameters([{ type: "string" }],   qRes);
    const [rawEndTime] = decodeAbiParameters([{ type: "uint256" }],  etRes);
    const totalYes    = tyRes ? (decodeAbiParameters([{ type: "uint256" }], tyRes)[0] as bigint) : 0n;
    const totalNo     = tnRes ? (decodeAbiParameters([{ type: "uint256" }], tnRes)[0] as bigint) : 0n;
    const yesToken    = ytRes ? (decodeAbiParameters([{ type: "address" }], ytRes)[0] as `0x${string}`) : "0x" as `0x${string}`;
    const noToken     = ntRes ? (decodeAbiParameters([{ type: "address" }], ntRes)[0] as `0x${string}`) : "0x" as `0x${string}`;
    const yesWon      = ywRes ? (decodeAbiParameters([{ type: "bool" }],    ywRes)[0] as boolean) : false;

    // Normalize endTime to seconds. Some contracts erroneously store the
    // value in milliseconds (or worse). Repeatedly divide by 1000 until the
    // value falls within a plausible range (before year 2100 in seconds).
    const YEAR_2100_SECS = 4102444800n;
    let endTime = rawEndTime as bigint;
    while (endTime > YEAR_2100_SECS && endTime > 1000n) {
      endTime = endTime / 1000n;
    }

    const { yesPrice, noPrice } = computePrices(totalYes, totalNo);
    return {
      address: addr,
      question:    question as string,
      endTime,
      yesToken,
      noToken,
      totalYes,
      totalNo,
      yesWon,
      yesPrice,
      noPrice,
      totalVolume: fromUsdc(totalYes + totalNo),
      status:      computeStatus(endTime as bigint, yesWon),
    };
  } catch {
    return null;
  }
}

// ── Factory reads ──

export function useAllMarketAddresses() {
  return useQuery({
    queryKey: ["factory", "getAllMarkets"],
    queryFn: async () => {
      const data = await rawCall(MARKET_FACTORY_ADDRESS, SEL_GET_ALL_MARKETS);
      if (!data) return [] as `0x${string}`[];
      const [addresses] = decodeAbiParameters([{ type: "address[]" }], data);
      return addresses as `0x${string}`[];
    },
    staleTime: 10_000,
  });
}

export function useMarketCount() {
  return useQuery({
    queryKey: ["factory", "getMarketCount"],
    queryFn: async () => {
      const data = await rawCall(MARKET_FACTORY_ADDRESS, SEL_GET_MARKET_COUNT);
      if (!data) return 0n;
      const [count] = decodeAbiParameters([{ type: "uint256" }], data);
      return count as bigint;
    },
    staleTime: 10_000,
  });
}

// ── Market reads ──

export function useAllMarkets() {
  const { data: addresses, isLoading: addrLoading } = useAllMarketAddresses();

  const { data: markets = [], isLoading: dataLoading } = useQuery({
    queryKey: ["markets", "all", addresses],
    queryFn: async () => {
      if (!addresses?.length) return [];
      const results = await Promise.all(addresses.map(fetchMarket));
      return results.filter((m): m is ChainMarket => m !== null);
    },
    enabled: !!addresses && addresses.length > 0,
    staleTime: 10_000,
    // Refetch every 30 s so expired markets auto-close in the UI
    refetchInterval: 30_000,
  });

  return {
    markets,
    isLoading: addrLoading || dataLoading,
    addresses: addresses ?? [],
  };
}

export function useMarket(marketAddress: `0x${string}` | undefined) {
  const { data: market = null, isLoading } = useQuery({
    queryKey: ["market", marketAddress],
    queryFn: () => fetchMarket(marketAddress!),
    enabled: !!marketAddress,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  return { market, isLoading };
}

// ── Token reads ──

export function useUsdcBalance(address: `0x${string}` | null | undefined) {
  const { data, refetch } = useQuery({
    queryKey: ["usdc", "balance", address],
    queryFn: async () => {
      const data = await rawCall(
        USDC_ADDRESS,
        SEL_BALANCE_OF,
        [{ type: "address" }],
        [address!]
      );
      if (!data) return 0n;
      const [bal] = decodeAbiParameters([{ type: "uint256" }], data);
      return bal as bigint;
    },
    enabled: !!address,
    staleTime: 15_000,
  });

  return {
    raw: data as bigint | undefined,
    formatted: data != null ? fromUsdc(data as bigint) : undefined,
    refetch,
  };
}

export function useUsdcAllowance(
  owner: `0x${string}` | null | undefined,
  spender: `0x${string}` | undefined
) {
  const { data, refetch } = useQuery({
    queryKey: ["usdc", "allowance", owner, spender],
    queryFn: async () => {
      const data = await rawCall(
        USDC_ADDRESS,
        SEL_ALLOWANCE,
        [{ type: "address" }, { type: "address" }],
        [owner!, spender!]
      );
      if (!data) return 0n;
      const [allowance] = decodeAbiParameters([{ type: "uint256" }], data);
      return allowance as bigint;
    },
    enabled: !!owner && !!spender,
    staleTime: 10_000,
  });

  return { allowance: data as bigint | undefined, refetch };
}

export function useTokenBalance(
  tokenAddress: `0x${string}` | undefined,
  account: `0x${string}` | null | undefined
) {
  const { data, refetch } = useQuery({
    queryKey: ["token", tokenAddress, "balance", account],
    queryFn: async () => {
      const data = await rawCall(
        tokenAddress!,
        SEL_BALANCE_OF,
        [{ type: "address" }],
        [account!]
      );
      if (!data) return 0n;
      const [bal] = decodeAbiParameters([{ type: "uint256" }], data);
      return bal as bigint;
    },
    enabled: !!tokenAddress && !!account && tokenAddress !== "0x",
    staleTime: 15_000,
  });

  return {
    raw: data as bigint | undefined,
    formatted: data != null ? fromUsdc(data as bigint) : undefined,
    refetch,
  };
}

// ── Write helpers ──

function makeWalletClient(address: `0x${string}`) {
  return createWalletClient({
    account: address,
    chain: arcTestnet,
    transport: custom(window.ethereum as any),
  });
}

export function usePlaceBet(marketAddress: `0x${string}` | undefined) {
  const { address } = useWallet();
  const qc = useQueryClient();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { allowance, refetch: refetchAllowance } = useUsdcAllowance(address, marketAddress);

  const placeBet = async (isYes: boolean, usdcAmount: number) => {
    if (!address || !marketAddress) throw new Error("Not connected");
    const raw = toUsdc(usdcAmount);
    setError(null);
    setIsSuccess(false);
    setIsPending(true);

    try {
      const wc = makeWalletClient(address);

      // Approve USDC if needed
      if (!allowance || allowance < raw) {
        const approveTx = await wc.writeContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [marketAddress, raw],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        await refetchAllowance();
      }

      // Place bet
      const hash = await wc.writeContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: "placeBet",
        args: [isYes, raw],
      });
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setIsSuccess(true);

      qc.invalidateQueries({ queryKey: ["market", marketAddress] });
      qc.invalidateQueries({ queryKey: ["usdc", "balance", address] });
      qc.invalidateQueries({ queryKey: ["markets", "all"] });
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setIsPending(false);
    }
  };

  return { placeBet, isPending, isSuccess, txHash, error };
}

export function useCreateMarket() {
  const { address } = useWallet();
  const qc = useQueryClient();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMarket = async (question: string, endTimestamp: number) => {
    if (!address) throw new Error("Not connected");
    setError(null);
    setIsSuccess(false);
    setIsPending(true);

    try {
      const wc = makeWalletClient(address);
      const hash = await wc.writeContract({
        address: MARKET_FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createMarket",
        args: [question, BigInt(endTimestamp)],
      });
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setIsSuccess(true);
      qc.invalidateQueries({ queryKey: ["factory"] });
      qc.invalidateQueries({ queryKey: ["markets"] });
      return hash;
    } catch (e: any) {
      const msg = e?.shortMessage ?? e?.message ?? "Transaction failed";
      setError(msg);
      throw e;
    } finally {
      setIsPending(false);
    }
  };

  return { createMarket, isPending, isSuccess, txHash, error };
}

export function useSellTokens(marketAddress: `0x${string}` | undefined) {
  const { address } = useWallet();
  const qc = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sell = async (
    isYes: boolean,
    tokenAddress: `0x${string}`,
    tokenAmount: bigint
  ) => {
    if (!address || !marketAddress) return;
    setError(null);
    setIsSuccess(false);
    setIsPending(true);

    try {
      const wc = makeWalletClient(address);

      // Approve the YES/NO token to be spent by the market contract
      const approveTx = await wc.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [marketAddress, tokenAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Call sell on the market contract
      const hash = await wc.writeContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: "sell",
        args: [isYes, tokenAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setIsSuccess(true);

      qc.invalidateQueries({ queryKey: ["market", marketAddress] });
      qc.invalidateQueries({ queryKey: ["usdc", "balance", address] });
      qc.invalidateQueries({ queryKey: ["token", tokenAddress] });
      qc.invalidateQueries({ queryKey: ["markets", "all"] });
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setIsPending(false);
    }
  };

  return { sell, isPending, isSuccess, error };
}

export function useResolveMarket(marketAddress: `0x${string}` | undefined) {
  const { address } = useWallet();
  const qc = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = async (outcome: boolean) => {
    if (!address || !marketAddress) return;
    setError(null);
    setIsSuccess(false);
    setIsPending(true);

    try {
      const wc = makeWalletClient(address);
      const hash = await wc.writeContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: "resolveMarket",
        args: [outcome],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setIsSuccess(true);
      qc.invalidateQueries({ queryKey: ["market", marketAddress] });
      qc.invalidateQueries({ queryKey: ["markets", "all"] });
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setIsPending(false);
    }
  };

  return { resolve, isPending, isSuccess, error };
}

export function useClaimWinnings(marketAddress: `0x${string}` | undefined) {
  const { address } = useWallet();
  const qc = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claim = async () => {
    if (!address || !marketAddress) return;
    setError(null);
    setIsSuccess(false);
    setIsPending(true);

    try {
      const wc = makeWalletClient(address);
      const hash = await wc.writeContract({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: "claimWinnings",
        args: [],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setIsSuccess(true);
      qc.invalidateQueries({ queryKey: ["market", marketAddress] });
      qc.invalidateQueries({ queryKey: ["usdc", "balance", address] });
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setIsPending(false);
    }
  };

  return { claim, isPending, isSuccess, error };
}

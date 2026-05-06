import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState } from "react";
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
  return {
    yesPrice: y / (y + n),
    noPrice: n / (y + n),
  };
}

function computeStatus(
  endTime: bigint,
  yesWon: boolean,
  isResolved: boolean
): ChainMarket["status"] {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (!isResolved && endTime > now) return "open";
  if (isResolved) return yesWon ? "resolved_yes" : "resolved_no";
  return "ended";
}

export function useAllMarketAddresses() {
  return useReadContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getAllMarkets",
  });
}

export function useMarketCount() {
  return useReadContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getMarketCount",
  });
}

export function useAllMarkets() {
  const { data: addresses, isLoading: addrLoading } = useAllMarketAddresses();

  const fields = [
    "question",
    "endTime",
    "yesToken",
    "noToken",
    "totalYes",
    "totalNo",
    "yesWon",
  ] as const;

  const contracts = (addresses ?? []).flatMap((addr) =>
    fields.map((fn) => ({
      address: addr as `0x${string}`,
      abi: MARKET_ABI,
      functionName: fn,
    }))
  );

  const { data: results, isLoading: dataLoading } = useReadContracts({
    contracts,
    query: { enabled: !!addresses && addresses.length > 0 },
  });

  const markets: ChainMarket[] = [];

  if (addresses && results) {
    const n = fields.length;
    for (let i = 0; i < addresses.length; i++) {
      const chunk = results.slice(i * n, (i + 1) * n);
      const [q, et, yt, nt, ty, tn, yw] = chunk;

      if (q.status === "failure" || et.status === "failure") continue;

      const question = q.result as string;
      const endTime = et.result as bigint;
      const yesToken = (yt.result as `0x${string}`) ?? "0x";
      const noToken = (nt.result as `0x${string}`) ?? "0x";
      const totalYes = (ty.result as bigint) ?? 0n;
      const totalNo = (tn.result as bigint) ?? 0n;
      const yesWon = (yw.result as boolean) ?? false;

      // Infer resolved: if endTime has passed and totalYes+totalNo > 0 and yesWon
      // is set, it's likely resolved. Without a resolved() flag we use endTime.
      const now = BigInt(Math.floor(Date.now() / 1000));
      const isEnded = endTime < now;
      // We treat "isResolved" as: market is ended AND yesWon is explicitly true
      // OR we can check if the market has settled by looking at both tokens
      const isResolved = isEnded && yw.status === "success";

      const { yesPrice, noPrice } = computePrices(totalYes, totalNo);
      const totalVolume = fromUsdc(totalYes + totalNo);
      const status = computeStatus(endTime, yesWon, isResolved);

      markets.push({
        address: addresses[i] as `0x${string}`,
        question,
        endTime,
        yesToken,
        noToken,
        totalYes,
        totalNo,
        yesWon,
        yesPrice,
        noPrice,
        totalVolume,
        status,
      });
    }
  }

  return {
    markets,
    isLoading: addrLoading || dataLoading,
    addresses: addresses ?? [],
  };
}

export function useMarket(marketAddress: `0x${string}` | undefined) {
  const fields = [
    "question",
    "endTime",
    "yesToken",
    "noToken",
    "totalYes",
    "totalNo",
    "yesWon",
  ] as const;

  const { data: results, isLoading } = useReadContracts({
    contracts: fields.map((fn) => ({
      address: marketAddress!,
      abi: MARKET_ABI,
      functionName: fn,
    })),
    query: { enabled: !!marketAddress },
  });

  if (!results || !marketAddress)
    return { market: null, isLoading };

  const [q, et, yt, nt, ty, tn, yw] = results;
  if (q.status === "failure") return { market: null, isLoading };

  const totalYes = (ty.result as bigint) ?? 0n;
  const totalNo = (tn.result as bigint) ?? 0n;
  const yesWon = (yw.result as boolean) ?? false;
  const endTime = (et.result as bigint) ?? 0n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isEnded = endTime < now;
  const isResolved = isEnded && yw.status === "success";

  const { yesPrice, noPrice } = computePrices(totalYes, totalNo);

  const market: ChainMarket = {
    address: marketAddress,
    question: (q.result as string) ?? "",
    endTime,
    yesToken: (yt.result as `0x${string}`) ?? "0x",
    noToken: (nt.result as `0x${string}`) ?? "0x",
    totalYes,
    totalNo,
    yesWon,
    yesPrice,
    noPrice,
    totalVolume: fromUsdc(totalYes + totalNo),
    status: computeStatus(endTime, yesWon, isResolved),
  };

  return { market, isLoading };
}

export function useUsdcBalance(address: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });
  return { raw: data as bigint | undefined, formatted: data ? fromUsdc(data as bigint) : undefined, refetch };
}

export function useUsdcAllowance(
  owner: `0x${string}` | undefined,
  spender: `0x${string}` | undefined
) {
  const { data, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner!, spender!],
    query: { enabled: !!owner && !!spender },
  });
  return { allowance: data as bigint | undefined, refetch };
}

export function useTokenBalance(
  tokenAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined
) {
  const { data, refetch } = useReadContract({
    address: tokenAddress!,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account!],
    query: { enabled: !!tokenAddress && !!account && tokenAddress !== "0x" },
  });
  return { raw: data as bigint | undefined, formatted: data ? fromUsdc(data as bigint) : undefined, refetch };
}

// --- Write hooks ---

export function usePlaceBet(marketAddress: `0x${string}` | undefined) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { allowance, refetch: refetchAllowance } = useUsdcAllowance(address, marketAddress);
  const { refetch: refetchBalance } = useUsdcBalance(address);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const placeBet = async (isYes: boolean, usdcAmount: number) => {
    if (!address || !marketAddress) throw new Error("Not connected");
    const raw = toUsdc(usdcAmount);
    setError(null);
    setIsPending(true);
    try {
      // Approve if needed
      if (!allowance || allowance < raw) {
        const approveTx = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [marketAddress, raw],
        });
        // wait briefly for approval to be mined before betting
        await new Promise((r) => setTimeout(r, 2000));
        await refetchAllowance();
      }

      const hash = await writeContractAsync({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: "placeBet",
        args: [isYes, raw],
      });
      setTxHash(hash);
      refetchBalance();
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setIsPending(false);
    }
  };

  return { placeBet, isPending: isPending || isConfirming, isSuccess, txHash, error };
}

export function useCreateMarket() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const createMarket = async (question: string, endTimestamp: number) => {
    setError(null);
    setIsPending(true);
    try {
      const hash = await writeContractAsync({
        address: MARKET_FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createMarket",
        args: [question, BigInt(endTimestamp)],
      });
      setTxHash(hash);
      return hash;
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
      throw e;
    } finally {
      setIsPending(false);
    }
  };

  return { createMarket, isPending: isPending || isConfirming, isSuccess, txHash, error };
}

export function useClaimWinnings(marketAddress: `0x${string}` | undefined) {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const claim = async () => {
    if (!marketAddress) return;
    setError(null);
    setIsPending(true);
    try {
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: "claimWinnings",
        args: [],
      });
      setTxHash(hash);
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setIsPending(false);
    }
  };

  return { claim, isPending: isPending || isConfirming, isSuccess, error };
}

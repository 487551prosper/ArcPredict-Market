# ArcPredict

A blockchain-native prediction market platform on Arc Testnet where users connect MetaMask (or any EVM wallet), browse on-chain YES/NO markets, place USDC bets, and track positions.

## Run & Operate

- `pnpm --filter @workspace/arcpredict run dev` — run the frontend (port from `$PORT`)
- `pnpm --filter @workspace/api-server run dev` — legacy API server (port 8080, not used by frontend)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `DATABASE_URL` — Postgres connection string (legacy API only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS 4, TanStack Query, Wouter, shadcn/ui
- Web3: viem v2 (no wagmi, no AppKit) + raw `window.ethereum` for wallet connection
- Chain: Arc Testnet (Chain ID: 5042002, RPC: https://rpc.testnet.arc.network)
- Build: Vite (static, no backend calls)

## Where things live

- `artifacts/arcpredict/src/lib/chain.ts` — viem `createPublicClient` + Arc Testnet chain definition
- `artifacts/arcpredict/src/lib/wallet.tsx` — `WalletProvider` context (window.ethereum connect/disconnect/switch)
- `artifacts/arcpredict/src/lib/contracts.ts` — ABIs + addresses + USDC helpers
- `artifacts/arcpredict/src/hooks/useChain.ts` — all read/write hooks (TanStack Query + viem raw calls)
- `artifacts/arcpredict/src/components/wallet-connect.tsx` — connect button + wrong-chain guard + dropdown
- `artifacts/arcpredict/src/pages/` — `home.tsx`, `market-detail.tsx`, `create-market.tsx`, `leaderboard.tsx`, `portfolio.tsx`

## Architecture decisions

- Dark-only theme; `document.documentElement.classList.add("dark")` forced in App.tsx
- All reads use `publicClient.call({ to, data: rawSelector })` + `decodeAbiParameters` — the deployed contracts use non-standard selectors that differ from their ABI function names
- Wallet = `window.ethereum` only; `connect()` calls `eth_requestAccounts` (triggers MetaMask popup), auto-switches to Arc Testnet
- User identity = connected wallet address (no auth layer)
- Probability = totalYes / (totalYes + totalNo); defaults to 50/50 with no volume
- Resolution: `resolveMarket(bool)` called by owner; `yesWon()` returns winner; `claimWinnings()` for payout
- Market route uses market contract address as URL param: `/markets/0x...`

## On-Chain Contracts (Arc Testnet)

**Factory** `0xF8073a17924A66097759f4c726725B8b063F5937`
- getAllMarkets() → raw selector `0xb0772d0b` → `address[]`
- getMarketCount() → raw selector `0xfd69f3c2` → `uint256`
- createMarket(string,uint256) — write via FACTORY_ABI

**USDC** `0x3600000000000000000000000000000000000000` (6 decimals)
- balanceOf(address) → `0x70a08231`
- allowance(address,address) → `0xdd62ed3e`

**Market contracts** (deployed by factory):
- question() → `0x3fad9ae0` → string
- endTime() → `0x3197cbb6` → uint256
- totalYes() → `0x88ba8dd6` → uint256
- totalNo() → `0xaf008883` → uint256
- yesToken() → `0x11a9f10a` → address
- noToken() → `0xf0d9bb20` → address
- yesWon() → `0xcbee38dc` → bool
- placeBet(bool isYes, uint256 amount) → `0xf7f74b22` — write via MARKET_ABI
- resolveMarket(bool outcome) → owner only — write via MARKET_ABI
- claimWinnings() → `0xb401faf1` — write via MARKET_ABI

**Deployed markets** (Arc Testnet):
- `0xfed62769dccd94dc7eaf10f14245ec8097d9f257`
- `0x3998d720743683ea5dfcd35efe82154e3c098f03`
- `0x4495f7bd1dec19bef184c9eb61b038a49af412e8`

## Product

- Connect MetaMask/Mises/any EVM wallet via window.ethereum (proper popup)
- Shows shortened address + USDC balance when connected; click to disconnect
- Auto-prompts chain switch to Arc Testnet on connect
- Browse on-chain markets with live YES/NO probabilities from USDC volumes
- Place USDC bets (approve + placeBet flow) with estimated payout preview
- Create markets on-chain via MarketFactory
- Portfolio page shows YES/NO token balances per market
- Leaderboard shows all markets ranked by volume

## User preferences

- Dark terminal aesthetic (Bloomberg-inspired), monospace fonts, tight layout

## Gotchas

- ABI function names in MARKET_ABI and FACTORY_ABI do NOT match the deployed bytecode selectors — always use raw `publicClient.call` with known selectors for reads
- Write functions (placeBet, resolveMarket, claimWinnings, createMarket) ARE correct in the ABI — use `walletClient.writeContract` normally
- `yesWon()` defaults to false before resolution — hard to distinguish "resolved NO" from "unresolved ended" without a separate `resolved()` flag
- Factory endTime values are very large (year ~205,000) — markets show as "open" with LIVE badge
- `placeBet` flow: approve USDC first, then bet — 2 MetaMask popups

## Pointers

- See `pnpm-workspace` skill for workspace structure and TypeScript setup

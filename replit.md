# ArcPredict

A blockchain-native prediction market platform on Arc Testnet where users connect MetaMask, browse on-chain YES/NO markets, place USDC bets, and track positions.

## Run & Operate

- `pnpm --filter @workspace/arcpredict run dev` — run the frontend (port from `$PORT`)
- `pnpm --filter @workspace/api-server run dev` — legacy API server (port 8080, still running but not used by frontend)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `DATABASE_URL` — Postgres connection string (legacy API only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS 4, TanStack Query, Wouter, shadcn/ui
- Web3: wagmi v3 + viem v2, @reown/appkit v1.8.19 (WalletConnect + injected wallets)
- Chain: Arc Testnet (Chain ID: 5042002, RPC: https://rpc.testnet.arc.network)
- Build: Vite (static, no backend calls)

## Where things live

- `artifacts/arcpredict/src/lib/chain.ts` — wagmi config + Arc Testnet chain definition
- `artifacts/arcpredict/src/lib/contracts.ts` — ABIs + addresses + USDC helpers
- `artifacts/arcpredict/src/hooks/useChain.ts` — all read/write hooks (markets, bets, USDC)
- `artifacts/arcpredict/src/components/wallet-connect.tsx` — MetaMask connect button + wrong-chain guard
- `artifacts/arcpredict/src/pages/` — `home.tsx`, `market-detail.tsx`, `create-market.tsx`, `leaderboard.tsx`, `portfolio.tsx`

## Architecture decisions

- Dark-only theme; `document.documentElement.classList.add("dark")` forced in App.tsx
- All data is read directly from Arc Testnet via wagmi `useReadContract` / `useReadContracts`
- User identity = connected wallet address (no auth layer)
- Probability = totalYes / (totalYes + totalNo); defaults to 50/50 with no volume
- Resolution: `resolveMarket(bool)` called by owner; `yesWon()` returns winner; `claimWinnings()` for payout
- Market route uses wallet address as URL param: `/markets/0x...`
- wagmi + viem in `devDependencies` (Vite static app); `resolve.dedupe` prevents React duplication
- `optimizeDeps.include: ["react", "react-dom", "wagmi", "viem"]` prevents multi-instance React crash

## On-Chain Contracts (Arc Testnet)

- **WalletConnect/AppKit** — `@reown/appkit` v1.8.19 + `@reown/appkit-adapter-wagmi`; project ID `75ee11fcb268a9ce1df27d9fe935cff2`; import `createAppKit` from `@reown/appkit/react` (NOT `@reown/appkit`) so `getAppKit(modal)` registers the React context
- **MarketFactory** `0xF8073a17924A66097759f4c726725B8b063F5937`
  - `createMarket(string question, uint256 endTime)` → deploys market
  - `getAllMarkets()` → `address[]`, `getMarketCount()` → `uint256`
- **USDC** `0x3600000000000000000000000000000000000000` (6 decimals)
- **Market contracts** (deployed by factory):
  - `question()`, `endTime()`, `totalYes()`, `totalNo()`, `yesToken()`, `noToken()`, `yesWon()`
  - `placeBet(bool isYes, uint256 amount)` — selector `0xf7f74b22`
  - `resolveMarket(bool outcome)` — owner only
  - `claimWinnings()` — winning token holders

## Product

- Connect MetaMask, switch to Arc Testnet (auto-prompt on wrong chain)
- Browse on-chain markets with live YES/NO probabilities from USDC volumes
- Place USDC bets (approve + placeBet flow) with estimated payout preview
- Create markets on-chain via MarketFactory (owner pays gas)
- Portfolio page shows YES/NO token balances per market
- Leaderboard shows all markets ranked by volume

## User preferences

- Dark terminal aesthetic (Bloomberg-inspired), monospace fonts, tight layout

## Gotchas

- Factory currently has 0 deployed markets — UI shows empty state correctly
- `yesWon()` selector `0xcbee38dc` confirmed; defaults to false before resolution — hard to distinguish "resolved NO" from "unresolved ended" without a separate `resolved()` flag
- After adding a market, the `useAllMarkets` hook re-fetches on next render (staleTime: 10s)
- `placeBet` flow: approve USDC first, then bet in same function — 2 MetaMask popups

## Pointers

- See `pnpm-workspace` skill for workspace structure and TypeScript setup

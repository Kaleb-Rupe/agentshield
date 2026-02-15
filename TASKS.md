# TASKS.md — Build Sequence & Progress Tracker

## Phase 1: Core Permission Engine (MVP) ✅

### 1.1 Project Setup ✅
- [x] Initialize Anchor project with `anchor init`
- [x] Configure Anchor.toml for localnet and devnet
- [x] Set up TypeScript test infrastructure
- [x] Verify `anchor build` and `anchor test` work with empty program

### 1.2 State Accounts ✅
- [x] Implement `state/vault.rs` — AgentVault account struct
- [x] Implement `state/policy.rs` — PolicyConfig account struct
- [x] Implement `state/tracker.rs` — SpendTracker, SpendEntry, TransactionRecord
- [x] Implement `state/session.rs` — SessionAuthority account struct (includes `action_type` field)
- [x] Implement `state/mod.rs` — VaultStatus, ActionType enums, constants
- [x] Verify all state compiles with `anchor build`

### 1.3 Errors & Events ✅
- [x] Implement `errors.rs` — all error codes from PROJECT.md
- [x] Implement `events.rs` — all events from PROJECT.md (including `FeesCollected`)
- [x] Verify compilation

### 1.4 Vault Management Instructions ✅
- [x] Implement `initialize_vault.rs` + tests
  - Test: creates vault, policy, and tracker PDAs ✅
  - Test: sets correct initial values ✅
  - Test: rejects duplicate vault_id ✅
- [x] Implement `deposit_funds.rs` + tests
  - Test: transfers tokens into vault PDA token account ✅
  - Test: rejects non-owner signer ✅
- [x] Implement `register_agent.rs` + tests
  - Test: registers agent pubkey ✅
  - Test: rejects if agent already registered ✅
  - Test: rejects non-owner signer ✅
- [x] Implement `update_policy.rs` + tests
  - Test: updates each field independently (Option pattern) ✅
  - Test: rejects non-owner signer ✅
  - Test: validates policy constraints (max tokens, max protocols) ✅
- [x] Implement `revoke_agent.rs` (kill switch) + tests
  - Test: sets vault status to Frozen ✅
  - Test: rejects non-owner signer ✅
  - Test: works when vault is already frozen (idempotent) ✅
- [x] Implement `reactivate_vault.rs` + tests
  - Test: sets vault status back to Active ✅
  - Test: optionally rotates agent key ✅
  - Test: rejects reactivating an already-active vault ✅
- [x] Implement `withdraw_funds.rs` + tests
  - Test: transfers tokens from vault to owner ✅
  - Test: rejects non-owner signer ✅
  - Test: rejects insufficient balance ✅
- [x] Implement `close_vault.rs` + tests
  - Test: closes vault and reclaims rent ✅
  - Test: rejects non-owner signer ✅

### 1.5 Permission Engine (Core Product) ✅
- [x] Implement `validate_and_authorize.rs`
  - [x] Check vault status is Active
  - [x] Check signer is registered agent
  - [x] Check token_mint is in allowed_tokens
  - [x] Check target_protocol is in allowed_protocols
  - [x] Check amount <= max_transaction_size
  - [x] Calculate rolling 24h spend, prune expired entries
  - [x] Check amount + rolling_spend <= daily_spending_cap
  - [x] If perp action: check leverage_bps <= max_leverage_bps
  - [x] If opening position: check count < max_concurrent_positions
  - [x] Create SessionAuthority PDA with expiry
  - [x] Store action_type in session for finalize to use
  - [x] Update SpendTracker
  - [x] Emit ActionAuthorized event
  - Tests:
    - [x] Happy path: agent authorized for valid action
    - [x] Denied: vault is frozen
    - [x] Denied: wrong agent key
    - [x] Denied: token not in whitelist
    - [x] Denied: protocol not in whitelist
    - [x] Denied: single tx exceeds max size
    - [x] Denied: daily cap exceeded (multiple small txs)
    - [x] Edge: session already exists (double-auth prevented)

- [x] Implement `finalize_session.rs`
  - [x] Verify session belongs to vault
  - [x] Record transaction in SpendTracker audit log (with correct action_type)
  - [x] Update open_positions counter (increment on OpenPosition, decrement on ClosePosition)
  - [x] Collect protocol fees via CPI token transfer
  - [x] Close SessionAuthority PDA, reclaim rent
  - Tests:
    - [x] Happy path: session finalized after DeFi action

### 1.6 Integration: lib.rs ✅
- [x] Wire all instructions into lib.rs program module
- [x] Implement instructions/mod.rs re-exports
- [x] Full `anchor build` succeeds
- [x] Full test suite passes (30 tests)

---

## Phase 2: Jupiter Integration ✅

### 2.1 Transaction Composition ✅
- [x] Build TypeScript transaction composer utility (`sdk/typescript/src/composer.ts`)
- [x] Compose: [SetComputeBudget, ValidateAndAuthorize, JupiterSwap, FinalizeSession]
- [x] Handle Jupiter V6 Swap API to get swap instruction (`sdk/typescript/src/integrations/jupiter.ts`)
- [x] Pass vault PDA token accounts as source/destination for swap
- [x] Test on localnet with mock DeFi instructions

### 2.2 Integration Tests ✅ (9 tests in `tests/jupiter-integration.ts`)
- [x] Agent swaps within policy → succeeds
- [x] Records multiple composed swaps correctly
- [x] Agent swaps above daily cap → entire tx reverts
- [x] Agent swaps disallowed token → entire tx reverts
- [x] Agent swaps disallowed protocol → entire tx reverts
- [x] Frozen vault → entire tx reverts
- [x] Rolling window spending → multiple swaps under cap, then rejects
- [x] deserializeInstruction utility works correctly

---

## Phase 3: Flash Trade Integration ✅

### 3.1 Flash Trade SDK Integration ✅
- [x] Integrate Flash Trade TypeScript SDK (`flash-sdk` npm package)
- [x] Map Flash Trade instructions: open_position, close_position, increase, decrease (`sdk/typescript/src/integrations/flash-trade.ts`)
- [x] Compose: [SetComputeBudget, ValidateAndAuthorize, FlashTradeOpen, FinalizeSession]
- [x] Enforce leverage limits from PolicyConfig
- [x] Track open position count (on-chain: finalize_session increments/decrements `vault.open_positions`)
- [x] Fix: action_type stored in SessionAuthority and used in finalize (was hardcoded to Swap)
- [x] Fix: open_positions counter updated in finalize_session (was never modified)

### 3.2 Integration Tests ✅ (9 tests in `tests/flash-trade-integration.ts`)
- [x] Agent opens leveraged long within policy → succeeds, open_positions incremented
- [x] Agent exceeds leverage limit → LeverageTooHigh revert
- [x] Agent exceeds max positions → TooManyPositions revert
- [x] Agent closes position → succeeds, open_positions decremented
- [x] Agent increases position → succeeds within policy
- [x] Agent decreases position → succeeds within policy
- [x] Frozen vault prevents new positions → VaultNotActive revert
- [x] Position opening disabled → PositionOpeningDisallowed revert
- [x] Action type recorded correctly in audit log (not hardcoded Swap)

---

## Phase 4: TypeScript SDK

### 4.1 Core SDK ✅
- [x] `client.ts` — AgentShieldClient class wrapping all instructions + Jupiter + Flash Trade
- [x] `instructions.ts` — Instruction builder functions
- [x] `accounts.ts` — Account fetching and deserialization
- [x] `types.ts` — TypeScript type definitions matching on-chain state
- [x] `composer.ts` — Transaction composition utilities
- [x] `index.ts` — Clean public exports
- [x] npm package configuration (package.json, tsconfig, build scripts)

### 4.2 Agent Framework Plugins ✅
- [x] Solana Agent Kit plugin (`plugins/solana-agent-kit/`)
  - [x] Plugin scaffolding (package.json, tsconfig.json)
  - [x] Types + WeakMap-cached client factory
  - [x] Read-only tools: shield_check_policy, shield_check_balance, shield_check_spending
  - [x] Write tools: shield_swap, shield_open_position, shield_close_position
  - [x] Plugin entry with Zod schemas and `createAgentShieldPlugin()` factory
- [x] ElizaOS plugin (`plugins/elizaos/`)
  - [x] Plugin scaffolding (package.json, tsconfig.json)
  - [x] Types (env var keys) + runtime-based client factory
  - [x] Providers: vaultStatus, spendTracking (context injection)
  - [x] Actions: SHIELD_SWAP, SHIELD_OPEN_POSITION, SHIELD_CLOSE_POSITION
  - [x] Evaluator: policyCheck (warns at >80% daily cap usage)
  - [x] Plugin assembly + default export

---

## Phase 4.3: Documentation & Publishing ✅
- [x] Root README.md — project overview, architecture, packages, quick start
- [x] `sdk/typescript/README.md` — installation, API reference, types, constants
- [x] `plugins/solana-agent-kit/README.md` — plugin setup, 6 tools, configuration
- [x] `plugins/elizaos/README.md` — plugin setup, env vars, actions/providers/evaluators
- [x] Bump all packages to v0.1.1
- [x] Publish `@agent-shield/sdk@0.1.1` to npm
- [x] Publish `@agent-shield/plugin-solana-agent-kit@0.1.1` to npm
- [x] Publish `@agent-shield/plugin-elizaos@0.1.1` to npm

### Devnet Deployment ✅
- [x] Fund deployer wallet on devnet (10 SOL via web faucet)
- [x] Deploy program to devnet (`4ZeVCqnjUgUtFrHHPG7jELUxvJeoVGHhGNgPrhBPwrHL`)
- [x] Upload IDL to devnet (IDL account: `Ev3gSzxLw6RwExAMpTHUKvn2o9YVULxiWehrHee7aepP`)

---

## Phase 4.4: Security Hardening & Sync ✅
- [x] Add `sessionRentRecipient` to finalize_session (prevents rent theft)
- [x] Expired session permissionless crank (anyone can clean up expired sessions)
- [x] Dual fee model: protocol fee (hardcoded 0.2 BPS) + developer fee (configurable 0–0.5 BPS)
- [x] Update SDK, plugins, and tests for security changes
- [x] Fix account namespace casing (PascalCase for Anchor 0.32.1)
- [x] Fix `feeBps` → `developerFeeRate` across all packages
- [x] All 39 core tests passing
- [x] Redeploy to devnet with updated IDL
- [x] Republish all npm packages at v0.1.2

---

## Phase 5: Dashboard

> Dashboard lives in a separate repo: `agentshield-dashboard`

### 5.1 Core App ✅
- [x] Next.js 14 App Router setup with Tailwind + shadcn/ui
- [x] Solana wallet adapter integration (SolanaProvider)
- [x] Anchor program provider (AnchorProvider, read-only mode when disconnected)
- [x] Network switching (devnet / mainnet-beta) with localStorage persistence
- [x] PascalCase account names for Anchor 0.32.1

### 5.2 Read Operations ✅
- [x] Vault detail page with live updates (useVaultLive — account change listeners)
- [x] My Vaults page (useMyVaults — memcmp filter by owner)
- [x] Explore / leaderboard page (useAllVaults — batch fetch with 30s polling)
- [x] Token balances display (useTokenBalances — getParsedTokenAccountsByOwner)
- [x] Activity feed (ActivityFeed — renders tracker.recentTransactions)
- [x] Spending progress bar (SpendingProgressBar — 24h rolling window calculation)
- [x] Policy display (PolicyDisplay — all policy fields)
- [x] Search by address, owner, or .sol domain (useSearch + Bonfida SNS)

### 5.3 Write Operations ✅ (wired but no error UX)
- [x] Create vault wizard (CreateVaultWizard → client.createVault())
- [x] Policy editor (PolicyEditor → client.updatePolicy())
- [x] Kill switch (KillSwitchButton → client.revokeAgent())

### 5.4 Missing Features — TODO
- [ ] **Deposit/Withdraw UI** — VaultBalances shows balances but has no deposit/withdraw buttons
- [ ] **Agent Registration UI** — no UI to call registerAgent() after vault creation
- [ ] **Reactivate Vault UI** — KillSwitch freezes, but no button to reactivate + rotate agent
- [ ] **Error toast notifications** — write ops log to console.error only, no user feedback
- [ ] **Transaction history CSV export** — activity feed exists but no export button
- [ ] **Real-time activity feed via Helius webhooks** — currently using account change listeners + polling

---

## Test Summary

| Suite | File | Tests |
|-------|------|-------|
| Core (Phase 1) | `tests/agent-shield.ts` | 39 |
| Jupiter (Phase 2) | `tests/jupiter-integration.ts` | 9 |
| Flash Trade (Phase 3) | `tests/flash-trade-integration.ts` | 9 |
| **Total** | | **57** |

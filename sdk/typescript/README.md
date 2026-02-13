# @agent-shield/sdk

TypeScript SDK for AgentShield — permission-guarded DeFi access for AI agents on Solana.

## Installation

```bash
npm install @agent-shield/sdk @coral-xyz/anchor @solana/web3.js
```

Peer dependencies: `@coral-xyz/anchor ^0.32.1`, `@solana/web3.js ^1.95.0`

Optional: `flash-sdk ^12.0.3` (only needed for Flash Trade perpetuals)

## Quick Start

```typescript
import { AgentShieldClient } from "@agent-shield/sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Wallet, BN } from "@coral-xyz/anchor";

const connection = new Connection("https://api.devnet.solana.com");
const wallet = new Wallet(ownerKeypair);
const client = new AgentShieldClient(connection, wallet);

// 1. Create a vault with policy
await client.createVault({
  vaultId: new BN(1),
  dailySpendingCap: new BN(500_000_000),   // 500 USDC (6 decimals)
  maxTransactionSize: new BN(100_000_000),  // 100 USDC per tx
  allowedTokens: [USDC_MINT, SOL_MINT],
  allowedProtocols: [JUPITER_PROGRAM_ID],
  maxLeverageBps: 0,
  maxConcurrentPositions: 0,
  feeDestination: feeWallet.publicKey,
});

// 2. Deposit funds
const [vaultPDA] = client.getVaultPDA(wallet.publicKey, new BN(1));
await client.deposit(vaultPDA, USDC_MINT, new BN(1_000_000_000));

// 3. Register an agent
await client.registerAgent(vaultPDA, agentKeypair.publicKey);

// 4. Agent executes a swap through Jupiter
const sig = await client.executeJupiterSwap({
  vault: vaultPDA,
  owner: wallet.publicKey,
  vaultId: new BN(1),
  agent: agentKeypair.publicKey,
  inputMint: USDC_MINT,
  outputMint: SOL_MINT,
  amount: new BN(10_000_000),
  slippageBps: 50,
});
```

## API Reference

### Vault Management

| Method | Description |
|--------|-------------|
| `createVault(params)` | Create a new vault with policy, tracker, and fee destination |
| `deposit(vault, mint, amount)` | Deposit SPL tokens into the vault |
| `registerAgent(vault, agent)` | Register an agent signing key on the vault |
| `updatePolicy(vault, params)` | Update policy fields (owner only) |
| `revokeAgent(vault)` | Freeze the vault — kill switch |
| `reactivateVault(vault, newAgent?)` | Unfreeze and optionally rotate agent key |
| `withdraw(vault, mint, amount)` | Withdraw tokens to owner (owner only) |
| `closeVault(vault)` | Close vault and reclaim rent |

### Permission Engine

| Method | Description |
|--------|-------------|
| `authorizeAction(vault, params)` | Validate an agent action against policy and create a session |
| `finalizeSession(vault, agent, success, ...)` | Close session, record audit, collect fees |

### Transaction Composition

These methods build atomic transactions in the pattern `[ValidateAndAuthorize, DeFi_ix, FinalizeSession]`:

| Method | Description |
|--------|-------------|
| `composePermittedAction(params, computeUnits?)` | Build instruction array for any DeFi action |
| `composePermittedTransaction(params, computeUnits?)` | Build a complete `VersionedTransaction` |
| `composePermittedSwap(params, computeUnits?)` | Shorthand for swap-type actions |
| `composeAndSend(params, signers?, computeUnits?)` | Compose, sign, send, and confirm in one call |

### Jupiter Integration

| Method | Description |
|--------|-------------|
| `getJupiterQuote(params)` | Fetch a swap quote from Jupiter V6 API |
| `jupiterSwap(params)` | Build an unsigned `VersionedTransaction` for a Jupiter swap |
| `executeJupiterSwap(params, signers?)` | Quote, compose, sign, send, and confirm |

### Flash Trade Integration

| Method | Description |
|--------|-------------|
| `flashTradeOpen(params, poolConfig?)` | Compose an open position through Flash Trade |
| `flashTradeClose(params, poolConfig?)` | Compose a close position |
| `flashTradeIncrease(params, poolConfig?)` | Compose an increase position |
| `flashTradeDecrease(params, poolConfig?)` | Compose a decrease position |
| `executeFlashTrade(result, agent, signers?)` | Sign, send, and confirm a Flash Trade transaction |
| `createFlashTradeClient(config?)` | Create/cache a `PerpetualsClient` |
| `getFlashPoolConfig(poolName?, cluster?)` | Get/cache Flash Trade pool config |

### PDA Helpers

```typescript
const [vaultPDA, bump] = client.getVaultPDA(owner, vaultId);
const [policyPDA] = client.getPolicyPDA(vaultPDA);
const [trackerPDA] = client.getTrackerPDA(vaultPDA);
const [sessionPDA] = client.getSessionPDA(vaultPDA, agent);
```

### Account Fetchers

```typescript
const vault = await client.fetchVault(owner, vaultId);
const policy = await client.fetchPolicy(vaultPDA);
const tracker = await client.fetchTracker(vaultPDA);

// Or fetch by address directly
const vault = await client.fetchVaultByAddress(vaultPDA);
const policy = await client.fetchPolicyByAddress(policyPDA);
const tracker = await client.fetchTrackerByAddress(trackerPDA);
```

## Types

### Instruction Parameters

- **`InitializeVaultParams`** — `vaultId`, `dailySpendingCap`, `maxTransactionSize`, `allowedTokens`, `allowedProtocols`, `maxLeverageBps`, `maxConcurrentPositions`, `feeDestination`
- **`UpdatePolicyParams`** — All policy fields as optionals (only set fields are updated)
- **`AuthorizeParams`** — `actionType`, `tokenMint`, `amount`, `targetProtocol`, `leverageBps?`
- **`ComposeActionParams`** — Full params for composed transactions including `defiInstructions`, `success?`, token accounts

### Account Types

- **`AgentVaultAccount`** — owner, agent, feeDestination, vaultId, status, stats
- **`PolicyConfigAccount`** — caps, whitelists, leverage limits, fee BPS
- **`SpendTrackerAccount`** — rolling spends, recent transactions
- **`SessionAuthorityAccount`** — ephemeral session with action type and expiry

### Enums

- **`VaultStatus`** — `{ active: {} }`, `{ frozen: {} }`, `{ closed: {} }`
- **`ActionType`** — `{ swap: {} }`, `{ openPosition: {} }`, `{ closePosition: {} }`, `{ increasePosition: {} }`, `{ decreasePosition: {} }`, `{ deposit: {} }`, `{ withdraw: {} }`

## Constants

```typescript
import {
  AGENT_SHIELD_PROGRAM_ID,  // 4ZeVCqnjUgUtFrHHPG7jELUxvJeoVGHhGNgPrhBPwrHL
  JUPITER_V6_API,            // https://quote-api.jup.ag/v6
  JUPITER_PROGRAM_ID,        // JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
  FLASH_TRADE_PROGRAM_ID,    // PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu
} from "@agent-shield/sdk";
```

## Architecture

The SDK uses **instruction composition** rather than CPI wrapping. This avoids Solana's 4-level CPI depth limit and keeps the compute budget manageable:

```
Transaction = [
  SetComputeUnitLimit(1_400_000),
  ValidateAndAuthorize,    // AgentShield: check policy, create session
  ...DeFi instructions,    // Jupiter swap / Flash Trade open / etc.
  FinalizeSession          // AgentShield: audit, fees, close session
]
```

All instructions in the transaction succeed or fail atomically.

## License

MIT

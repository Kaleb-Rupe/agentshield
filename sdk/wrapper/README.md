# @agent-shield/solana

Client-side spending controls for Solana AI agents. Three lines of code.

`@agent-shield/solana` wraps any Solana wallet with transparent policy enforcement. Every `signTransaction` call passes through a policy engine that checks spending caps, rate limits, and protocol allowlists before signing. If a policy is violated, the transaction is rejected with an actionable error. No on-chain setup, no PDA vaults, no program deployment.

## Installation

```bash
npm install @agent-shield/solana @solana/web3.js
```

Peer dependencies: `@solana/web3.js >=1.90.0`

Optional: `@agent-shield/sdk ^0.1.0` (only needed for `harden()` — on-chain vault upgrade)

## Quick Start

```typescript
import { shield } from "@agent-shield/solana";

// Wrap any wallet in 1 line — secure defaults applied automatically
const protectedWallet = shield(wallet, { maxSpend: "500 USDC/day" });

// Use it like a normal wallet — shield enforces policies transparently
const agent = new SolanaAgentKit(protectedWallet, RPC_URL, config);
```

With no config, secure defaults are applied:
- 1,000 USDC/day, 1,000 USDT/day, 10 SOL/day spending caps
- Unknown programs blocked (only registered DeFi protocols allowed)
- 60 transactions/hour rate limit

## How It Works

```
┌───────────────────────────────────────────────────┐
│  Your Agent Code                                   │
│  agent.swap(USDC, SOL, 100)                       │
└──────────────┬────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│  shield() wrapper                                 │
│  1. Analyze transaction (programs, transfers)     │
│  2. Check spending caps (rolling 24h window)      │
│  3. Check rate limit                              │
│  4. Check protocol/token allowlists               │
│  5. If all pass → sign with inner wallet          │
│     If any fail → throw ShieldDeniedError         │
└──────────────┬────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│  Inner Wallet (Keypair, adapter, Turnkey, etc.)   │
│  tx.sign(keypair)                                 │
└──────────────────────────────────────────────────┘
```

## API Reference

### `shield(wallet, policies?, options?): ShieldedWallet`

Wrap a wallet with policy enforcement.

```typescript
import { shield } from "@agent-shield/solana";

const protectedWallet = shield(wallet, {
  maxSpend: "500 USDC/day",
  blockUnknownPrograms: true,
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `wallet` | `WalletLike` | Any wallet with `publicKey` and `signTransaction` |
| `policies` | `ShieldPolicies` | Policy configuration (optional — defaults applied) |
| `options` | `ShieldOptions` | Event callbacks and storage config (optional) |

**Returns:** `ShieldedWallet` — same interface as the input wallet, with policy enforcement added.

### `ShieldedWallet`

The shielded wallet extends `WalletLike` with management methods:

| Property/Method | Description |
|-----------------|-------------|
| `publicKey` | Same public key as the inner wallet |
| `innerWallet` | Reference to the underlying wallet |
| `shieldState` | Current spending tracker state |
| `isHardened` | Whether on-chain enforcement is active |
| `isPaused` | Whether policy enforcement is paused |
| `signTransaction(tx)` | Signs with policy enforcement |
| `signAllTransactions(txs)` | Signs batch with cumulative enforcement |
| `updatePolicies(policies)` | Update policies at runtime |
| `resetState()` | Clear all spending history |
| `pause()` | Temporarily disable enforcement |
| `resume()` | Re-enable enforcement |
| `getSpendingSummary()` | Get current spending relative to limits |

### Policy Configuration (`ShieldPolicies`)

```typescript
const protectedWallet = shield(wallet, {
  // Spending caps — human-readable strings or SpendLimit objects
  maxSpend: "500 USDC/day",                          // single limit
  maxSpend: ["500 USDC/day", "10 SOL/hour"],         // multiple limits
  maxSpend: { mint: USDC_MINT, amount: 500_000_000n, windowMs: 86_400_000 },

  // Single transaction size limit (base units)
  maxTransactionSize: 100_000_000n,

  // Protocol allowlist — only these + system programs are allowed
  allowedProtocols: [JUPITER_PROGRAM_ID],

  // Token allowlist — only these tokens can be transferred
  allowedTokens: [USDC_MINT, SOL_MINT],

  // Block unregistered programs (default: true)
  blockUnknownPrograms: true,

  // Rate limit
  rateLimit: { maxTransactions: 60, windowMs: 3_600_000 },

  // Custom policy check (runs after built-in checks)
  customCheck: (analysis) => ({ allowed: true }),
});
```

**Supported spend limit formats:**

| Format | Example |
|--------|---------|
| String shorthand | `"500 USDC/day"` |
| Array of strings | `["500 USDC/day", "10 SOL/hour"]` |
| SpendLimit object | `{ mint: "EPjF...", amount: 500_000_000n }` |
| Array of objects | `[{ mint: "EPjF...", amount: 500_000_000n }]` |
| Empty (defaults) | `undefined` |

**Supported tokens:** USDC, USDT, USDS, SOL, wBTC, cbBTC, wETH, mSOL, jitoSOL, bSOL

**Supported time windows:** `/day` (24h), `/hour` (1h), `/hr` (1h), `/min` (1m), `/minute` (1m)

### Event Callbacks (`ShieldOptions`)

```typescript
const protectedWallet = shield(wallet, policies, {
  onDenied: (error) => {
    console.error("Denied:", error.violations);
  },
  onApproved: (txHash) => {
    console.log("Approved:", txHash);
  },
  onPause: () => console.log("Enforcement paused"),
  onResume: () => console.log("Enforcement resumed"),
  onPolicyUpdate: (newPolicies) => console.log("Policies updated"),

  // Custom storage for state persistence
  storage: localStorage, // or any { getItem, setItem } interface
});
```

| Callback | Fires When |
|----------|------------|
| `onDenied` | Transaction rejected by policy engine |
| `onApproved` | Transaction signed successfully |
| `onPause` | `wallet.pause()` is called |
| `onResume` | `wallet.resume()` is called |
| `onPolicyUpdate` | `wallet.updatePolicies()` is called |

### Spending Summary

```typescript
const summary = protectedWallet.getSpendingSummary();

// summary.tokens — per-token spending vs limits
for (const token of summary.tokens) {
  console.log(`${token.symbol}: ${token.spent} / ${token.limit} (${token.remaining} remaining)`);
}

// summary.rateLimit — transaction count vs limit
console.log(`Transactions: ${summary.rateLimit.count} / ${summary.rateLimit.limit}`);

// summary.isPaused — enforcement state
console.log(`Paused: ${summary.isPaused}`);
```

**`SpendingSummary` shape:**

```typescript
interface SpendingSummary {
  tokens: Array<{
    mint: string;
    symbol: string | undefined;
    spent: bigint;
    limit: bigint;
    remaining: bigint;
    windowMs: number;
  }>;
  rateLimit: {
    count: number;
    limit: number;
    remaining: number;
    windowMs: number;
  };
  isPaused: boolean;
}
```

### Runtime Management

```typescript
// Pause enforcement (transactions pass through without checks)
protectedWallet.pause();

// Resume enforcement
protectedWallet.resume();

// Update policies at runtime
protectedWallet.updatePolicies({
  maxSpend: "1000 USDC/day",
  blockUnknownPrograms: false,
});

// Clear all spending history
protectedWallet.resetState();
```

### Error Handling

```typescript
import { ShieldDeniedError } from "@agent-shield/solana";

try {
  await protectedWallet.signTransaction(tx);
} catch (error) {
  if (error instanceof ShieldDeniedError) {
    for (const violation of error.violations) {
      console.log(violation.rule);       // "spending_cap"
      console.log(violation.message);    // "Spending cap exceeded for USDC: ..."
      console.log(violation.suggestion); // "Reduce amount to 300000000 or ..."
    }
  }
}
```

**Violation rules:**

| Rule | Description |
|------|-------------|
| `spending_cap` | Token spend exceeds rolling window cap |
| `transaction_size` | Single transaction exceeds max size |
| `unknown_program` | Transaction uses an unregistered program |
| `protocol_not_allowed` | Program not in explicit allowlist |
| `token_not_allowed` | Token mint not in explicit allowlist |
| `rate_limit` | Too many transactions in the time window |

### Wallet Compatibility (`WalletLike`)

`shield()` works with any wallet that implements this minimal interface:

```typescript
interface WalletLike {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions?<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}
```

Compatible with:
- `@solana/web3.js` Keypair wallets
- `@solana/wallet-adapter` browser wallets (Phantom, Solflare, etc.)
- Turnkey TEE-backed wallets
- Privy embedded wallets
- Coinbase agentic wallets
- Any custom signing implementation

### Transaction Inspection

```typescript
import { analyzeTransaction, getNonSystemProgramIds } from "@agent-shield/solana";

// Analyze a transaction for policy evaluation
const analysis = analyzeTransaction(transaction, walletPublicKey);
// → { programIds: [...], transfers: [...], estimatedValueLamports: 0n }

// Get non-system program IDs from a transaction
const programIds = getNonSystemProgramIds(transaction);
// → ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"]
```

### Protocol Registry

```typescript
import {
  KNOWN_PROTOCOLS,
  KNOWN_TOKENS,
  isKnownProtocol,
  getProtocolName,
  getTokenInfo,
} from "@agent-shield/solana";

isKnownProtocol("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"); // true
getProtocolName("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"); // "Jupiter V6"
getTokenInfo("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");   // { symbol: "USDC", decimals: 6 }
```

**Registered DeFi protocols:** Jupiter (V2-V6), Orca, Raydium (V4 + CPMM + CLMM), Meteora (DLMM + Pools), Flash Trade, Drift, Mango V4, Kamino, Marginfi, Solend, Marinade, Jito, Saber, OpenBook V2, and more.

## Integration Examples

### Solana Agent Kit

```typescript
import { shield } from "@agent-shield/solana";
import { createAgentShieldPlugin } from "@agent-shield/plugin-solana-agent-kit";
import { SolanaAgentKit } from "solana-agent-kit";

const protectedWallet = shield(wallet, { maxSpend: "500 USDC/day" });
const plugin = createAgentShieldPlugin({ wallet: protectedWallet });
const agent = new SolanaAgentKit(protectedWallet, RPC_URL, { plugins: [plugin] });
```

### ElizaOS

```typescript
import { agentShieldPlugin } from "@agent-shield/plugin-elizaos";

const character = {
  name: "DeFi Agent",
  plugins: [agentShieldPlugin],
};
// Configure via env vars: SOLANA_WALLET_PRIVATE_KEY, AGENT_SHIELD_MAX_SPEND
```

### Custom Agent

```typescript
import { shield, ShieldDeniedError } from "@agent-shield/solana";

const protectedWallet = shield(wallet, {
  maxSpend: ["500 USDC/day", "10 SOL/day"],
  blockUnknownPrograms: true,
  rateLimit: { maxTransactions: 30, windowMs: 3_600_000 },
});

async function agentLoop() {
  try {
    const tx = buildSwapTransaction();
    const signed = await protectedWallet.signTransaction(tx);
    await connection.sendRawTransaction(signed.serialize());
  } catch (error) {
    if (error instanceof ShieldDeniedError) {
      console.log("Policy blocked:", error.violations[0].suggestion);
    }
  }
}
```

## Three-Tier Security Model

`@agent-shield/solana` is **Level 1** in AgentShield's three-tier architecture:

```
Level 1: Client-Side Wrapper (this package)
  shield(wallet, { maxSpend: '500 USDC/day' })
  → Zero friction, 3 lines of code
  → Client-side enforcement, works with ANY wallet

Level 2: TEE-Backed Signing (coming soon)
  shield(wallet, { custody: 'turnkey' })
  → Keys held in TEE, agent code never touches private keys

Level 3: On-Chain Vault (@agent-shield/sdk)
  shield.harden(wallet, { onChain: true })
  → PDA vault with cryptographic guarantees
  → Cannot be bypassed even by compromised software
```

Start at Level 1. Upgrade to Level 3 when you need cryptographic guarantees.

## Related Packages

| Package | Description |
|---------|-------------|
| [`@agent-shield/core`](https://www.npmjs.com/package/@agent-shield/core) | Pure TypeScript policy engine (used internally) |
| [`@agent-shield/sdk`](https://www.npmjs.com/package/@agent-shield/sdk) | On-chain vault SDK for Level 3 enforcement |
| [`@agent-shield/plugin-solana-agent-kit`](https://www.npmjs.com/package/@agent-shield/plugin-solana-agent-kit) | Solana Agent Kit integration |
| [`@agent-shield/plugin-elizaos`](https://www.npmjs.com/package/@agent-shield/plugin-elizaos) | ElizaOS integration |

## Support

- X/Twitter: [@MightieMags](https://x.com/MightieMags)
- Telegram: [MightyMags](https://t.me/MightyMags)
- Issues: [GitHub Issues](https://github.com/Kaleb-Rupe/agentshield/issues)

## License

MIT

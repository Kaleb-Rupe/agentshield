# @agent-shield/plugin-elizaos

AgentShield plugin for [ElizaOS](https://github.com/elizaOS/eliza) — provides shield status actions, spending providers, and policy evaluators for AI agents with client-side spending controls. Zero on-chain setup required.

## Installation

```bash
npm install @agent-shield/plugin-elizaos @agent-shield/solana
```

Peer dependencies: `@elizaos/core >=0.1.0`, `@agent-shield/solana >=0.1.0`, `@solana/web3.js >=1.90.0`

## Quick Start

```typescript
import { agentShieldPlugin } from "@agent-shield/plugin-elizaos";

// Register in your ElizaOS character config
const character = {
  name: "DeFi Agent",
  plugins: [agentShieldPlugin],
  settings: {
    // ... other settings
  },
};
```

The plugin reads environment variables to create a `ShieldedWallet` automatically.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SOLANA_WALLET_PRIVATE_KEY` | Yes | Agent wallet private key (base58 or JSON array) |
| `AGENT_SHIELD_MAX_SPEND` | No | Spending limit, e.g. `"500 USDC/day"`. Defaults to 1000 USDC/day, 1000 USDT/day, 10 SOL/day |
| `AGENT_SHIELD_BLOCK_UNKNOWN` | No | Block unknown programs: `"true"` or `"false"` (default: `"true"`) |

## Actions

The plugin provides 2 actions that agents can invoke conversationally:

| Action | Triggers | Description |
|--------|----------|-------------|
| `SHIELD_STATUS` | "shield status", "spending", "budget" | Returns current spending summary — per-token usage, rate limit, and enforcement state |
| `SHIELD_UPDATE_POLICY` | "update policy", "change limit" | Update spending limits or program blocking at runtime |

## Providers

Providers inject shield context into the agent's memory before each response:

| Provider | Description |
|----------|-------------|
| `shieldStatusProvider` | Injects enforcement state (active/paused), wallet address, and spending overview |
| `spendTrackingProvider` | Injects per-token spending data with usage percentages and remaining budget |

## Evaluators

Evaluators run after actions to assess state:

| Evaluator | Description |
|-----------|-------------|
| `policyCheckEvaluator` | Warns in agent memory when any token's spending exceeds 80% of its cap, helping the agent self-regulate |

## How It Works

The plugin creates a `ShieldedWallet` from the agent's private key and policy config (env vars). The shield wraps `signTransaction` — any DeFi action the agent takes passes through the policy engine before signing. If a spending cap, rate limit, or program restriction is violated, the transaction is rejected.

Providers give the agent awareness of its budget. The evaluator proactively warns when spending approaches limits. No on-chain vault setup is needed — everything runs client-side.

## License

MIT

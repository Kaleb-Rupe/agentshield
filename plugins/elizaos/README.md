# @agent-shield/plugin-elizaos

AgentShield plugin for [ElizaOS](https://github.com/elizaOS/eliza) — provides DeFi actions, vault status providers, and policy evaluators for AI agents operating through permission-guarded Solana vaults.

## Installation

```bash
npm install @agent-shield/plugin-elizaos @agent-shield/sdk
```

Peer dependencies: `@elizaos/core >=0.1.0`, `@agent-shield/sdk >=0.1.0`, `@solana/web3.js >=1.90.0`, `@coral-xyz/anchor >=0.30.0`

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

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENT_SHIELD_VAULT_OWNER` | Yes | Vault owner public key (base58) |
| `AGENT_SHIELD_VAULT_ID` | Yes | Vault identifier (u64 as string) |
| `SOLANA_RPC_URL` | Yes | Solana RPC endpoint |
| `SOLANA_WALLET_PRIVATE_KEY` | Yes | Agent wallet private key (base58 or JSON array) |
| `AGENT_SHIELD_PROGRAM_ID` | No | Custom program ID override |

## Actions

The plugin provides 3 actions that agents can invoke conversationally:

| Action | Description |
|--------|-------------|
| `SHIELD_SWAP` | Execute a token swap through Jupiter, routed through the AgentShield vault with on-chain policy enforcement (spending caps, token whitelists) |
| `SHIELD_OPEN_POSITION` | Open a leveraged perpetual position on Flash Trade through the vault. Enforces leverage limits and position count caps |
| `SHIELD_CLOSE_POSITION` | Close an existing perpetual position on Flash Trade through the vault |

## Providers

Providers inject vault context into the agent's memory before each response:

| Provider | Description |
|----------|-------------|
| `vaultStatusProvider` | Injects current vault status, agent key, total volume, open positions, and fees collected into the agent's context |
| `spendTrackingProvider` | Injects rolling 24h spending data per token and recent transaction history so the agent is aware of remaining budget |

## Evaluators

Evaluators run after shield actions to assess state:

| Evaluator | Description |
|-----------|-------------|
| `policyCheckEvaluator` | Runs after any shield action. Warns in agent memory when rolling 24h spend exceeds 80% of the daily cap, helping the agent self-regulate |

## How It Works

The plugin reads environment variables at runtime to create an `AgentShieldClient`. All actions build atomic composed transactions:

```
[ValidateAndAuthorize, DeFi instruction(s), FinalizeSession]
```

Providers run before agent responses to inject vault context. The evaluator runs after shield actions to track budget usage.

## License

MIT

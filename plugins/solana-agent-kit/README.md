# @agent-shield/plugin-solana-agent-kit

AgentShield plugin for [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit) — routes agent DeFi actions through permission-guarded vaults with spending limits, token whitelists, and leverage controls.

## Installation

```bash
npm install @agent-shield/plugin-solana-agent-kit @agent-shield/sdk
```

Peer dependencies: `solana-agent-kit >=2.0.0`, `@agent-shield/sdk >=0.1.0`, `@solana/web3.js >=1.90.0`, `@coral-xyz/anchor >=0.30.0`

## Quick Start

```typescript
import { createAgentShieldPlugin } from "@agent-shield/plugin-solana-agent-kit";
import { SolanaAgentKit } from "solana-agent-kit";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

const plugin = createAgentShieldPlugin({
  vaultOwner: new PublicKey("..."),  // vault owner pubkey
  vaultId: new BN(1),               // vault identifier
});

const agent = new SolanaAgentKit(wallet, rpcUrl, {
  plugins: [plugin],
});
```

## Tools

The plugin registers 6 tools on the agent:

### Trading

| Tool | Description | Parameters |
|------|-------------|------------|
| `shield_swap` | Execute a token swap through Jupiter, routed through the AgentShield vault with policy enforcement | `inputMint`, `outputMint`, `amount`, `slippageBps` |
| `shield_open_position` | Open a leveraged perpetual position on Flash Trade. Enforces leverage limits and position count caps | `collateralMint`, `targetMint`, `collateralAmount`, `side`, `leverage` |
| `shield_close_position` | Close an existing perpetual position on Flash Trade | `positionMint`, `targetMint`, `side` |

### Read-Only

| Tool | Description | Parameters |
|------|-------------|------------|
| `shield_check_policy` | Read the vault policy: spending caps, allowed tokens/protocols, leverage limits, fee BPS | *(none)* |
| `shield_check_balance` | Read vault balances, status, and statistics (total volume, open positions, fees collected) | *(none)* |
| `shield_check_spending` | Read the rolling 24h spending tracker: per-token spend vs daily cap, recent transaction history | *(none)* |

## Configuration

```typescript
interface AgentShieldPluginConfig {
  /** Vault owner public key */
  vaultOwner: PublicKey;
  /** Vault identifier (u64) */
  vaultId: BN;
  /** Optional program ID override (defaults to mainnet deployment) */
  programId?: PublicKey;
}
```

The plugin creates an `AgentShieldClient` on initialization using the agent's connection and wallet. The client is cached per agent instance.

## How It Works

All trading tools (`shield_swap`, `shield_open_position`, `shield_close_position`) build atomic composed transactions:

```
[ValidateAndAuthorize, DeFi instruction(s), FinalizeSession]
```

The on-chain program checks the agent's action against the vault policy (spending cap, token whitelist, protocol whitelist, leverage limits) before the DeFi instruction executes. If any check fails, the entire transaction reverts.

## License

MIT

# @agent-shield/plugin-solana-agent-kit

AgentShield plugin for [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit) — adds shield monitoring and management tools to any SAK agent. The shield wraps wallet signing transparently, so SAK's built-in swap/position tools are automatically policy-guarded.

## Installation

```bash
npm install @agent-shield/plugin-solana-agent-kit @agent-shield/solana
```

Peer dependencies: `solana-agent-kit >=2.0.0`, `@agent-shield/solana >=0.1.0`, `@solana/web3.js >=1.90.0`

## Quick Start

```typescript
import { shield } from "@agent-shield/solana";
import { createAgentShieldPlugin } from "@agent-shield/plugin-solana-agent-kit";
import { SolanaAgentKit } from "solana-agent-kit";

// 1. Wrap your wallet with spending controls (one line)
const protectedWallet = shield(wallet, { maxSpend: "500 USDC/day" });

// 2. Create the plugin (provides monitoring tools)
const plugin = createAgentShieldPlugin({ wallet: protectedWallet });

// 3. Create the agent — all actions are now policy-guarded
const agent = new SolanaAgentKit(protectedWallet, rpcUrl, {
  plugins: [plugin],
});
```

## Tools

The plugin registers 3 monitoring/management tools on the agent:

| Tool | Description | Parameters |
|------|-------------|------------|
| `shield_status` | Check current spending vs limits, rate limit usage, and enforcement state | *(none)* |
| `shield_update_policy` | Update spending limits or program blocking at runtime | `maxSpend?`, `blockUnknownPrograms?` |
| `shield_pause_resume` | Pause or resume policy enforcement | `action: "pause" \| "resume"` |

## Configuration

```typescript
import type { ShieldedWallet } from "@agent-shield/solana";

interface AgentShieldPluginConfig {
  /** A pre-created ShieldedWallet (from shield()) */
  wallet: ShieldedWallet;
}
```

## How It Works

The `shield()` wrapper intercepts `signTransaction` and `signAllTransactions` on the wallet. When the agent calls any SAK tool (swap, transfer, etc.), the transaction passes through the shield's policy engine before signing. If a policy is violated, the transaction is rejected with a descriptive error.

The plugin's tools give the agent visibility into spending state and the ability to manage enforcement — no DeFi execution tools are needed since the shield guards signing transparently.

## License

MIT

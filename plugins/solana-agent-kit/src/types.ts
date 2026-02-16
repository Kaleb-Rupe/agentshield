import type { ShieldedWallet } from "@agent-shield/solana";

export interface AgentShieldPluginConfig {
  /** A pre-created ShieldedWallet (from shield()) */
  wallet: ShieldedWallet;
}

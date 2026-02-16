/**
 * Environment variable keys used by the AgentShield ElizaOS plugin.
 * Configure these in your ElizaOS `.env` or character settings.
 */
export const ENV_KEYS = {
  /** Spending limit, e.g. "500 USDC/day" */
  MAX_SPEND: "AGENT_SHIELD_MAX_SPEND",
  /** Block unknown programs: "true" or "false" (default: true) */
  BLOCK_UNKNOWN: "AGENT_SHIELD_BLOCK_UNKNOWN",
  /** Solana RPC URL */
  RPC_URL: "SOLANA_RPC_URL",
  /** Solana wallet private key (base58 or JSON array) */
  WALLET_PRIVATE_KEY: "SOLANA_WALLET_PRIVATE_KEY",
} as const;

export interface AgentShieldElizaConfig {
  maxSpend?: string;
  blockUnknown: boolean;
  walletPrivateKey: string;
}

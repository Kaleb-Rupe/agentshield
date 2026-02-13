/**
 * Environment variable keys used by the AgentShield ElizaOS plugin.
 * Configure these in your ElizaOS `.env` or character settings.
 */
export const ENV_KEYS = {
  /** Vault owner public key (base58) */
  VAULT_OWNER: "AGENT_SHIELD_VAULT_OWNER",
  /** Vault ID (u64 as string) */
  VAULT_ID: "AGENT_SHIELD_VAULT_ID",
  /** Optional AgentShield program ID override */
  PROGRAM_ID: "AGENT_SHIELD_PROGRAM_ID",
  /** Solana RPC URL */
  RPC_URL: "SOLANA_RPC_URL",
  /** Solana wallet private key (base58 or JSON array) */
  WALLET_PRIVATE_KEY: "SOLANA_WALLET_PRIVATE_KEY",
} as const;

export interface AgentShieldElizaConfig {
  vaultOwner: string;
  vaultId: string;
  programId?: string;
  rpcUrl: string;
  walletPrivateKey: string;
}

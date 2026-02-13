import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export interface AgentShieldPluginConfig {
  /** Vault owner public key */
  vaultOwner: PublicKey;
  /** Vault identifier (u64) */
  vaultId: BN;
  /** Optional program ID override (defaults to mainnet deployment) */
  programId?: PublicKey;
}

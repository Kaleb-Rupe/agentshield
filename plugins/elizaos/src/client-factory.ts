import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";
import { AgentShieldClient } from "@agent-shield/sdk";
import { ENV_KEYS, AgentShieldElizaConfig } from "./types";

const clientCache = new WeakMap<object, AgentShieldClient>();

/**
 * Reads AgentShield config from ElizaOS runtime settings.
 */
export function getConfig(runtime: any): AgentShieldElizaConfig {
  const get = (key: string): string => {
    const val = runtime.getSetting(key);
    if (!val) throw new Error(`AgentShield: missing required setting '${key}'`);
    return val;
  };

  return {
    vaultOwner: get(ENV_KEYS.VAULT_OWNER),
    vaultId: get(ENV_KEYS.VAULT_ID),
    programId: runtime.getSetting(ENV_KEYS.PROGRAM_ID) || undefined,
    rpcUrl: get(ENV_KEYS.RPC_URL),
    walletPrivateKey: get(ENV_KEYS.WALLET_PRIVATE_KEY),
  };
}

/**
 * Parses a private key from either base58 or JSON array format.
 */
function parseKeypair(raw: string): Keypair {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Keypair.fromSecretKey(Uint8Array.from(parsed));
    }
  } catch {
    // Not JSON — try base58
  }
  // base58 secret key (64 bytes)
  const bs58 = require("bs58");
  return Keypair.fromSecretKey(bs58.decode(raw));
}

/**
 * Gets or creates an AgentShieldClient for the given ElizaOS runtime.
 * Cached per runtime instance via WeakMap.
 */
export function getOrCreateClient(runtime: any): {
  client: AgentShieldClient;
  vaultOwner: PublicKey;
  vaultId: BN;
  agentKey: PublicKey;
} {
  const cached = clientCache.get(runtime);
  const config = getConfig(runtime);

  if (cached) {
    return {
      client: cached,
      vaultOwner: new PublicKey(config.vaultOwner),
      vaultId: new BN(config.vaultId),
      agentKey: parseKeypair(config.walletPrivateKey).publicKey,
    };
  }

  const connection = new Connection(config.rpcUrl, "confirmed");
  const keypair = parseKeypair(config.walletPrivateKey);
  const wallet = new Wallet(keypair);

  const programId = config.programId
    ? new PublicKey(config.programId)
    : undefined;

  const client = new AgentShieldClient(connection, wallet, programId);
  clientCache.set(runtime, client);

  return {
    client,
    vaultOwner: new PublicKey(config.vaultOwner),
    vaultId: new BN(config.vaultId),
    agentKey: keypair.publicKey,
  };
}

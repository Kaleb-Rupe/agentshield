import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { shield } from "@agent-shield/solana";
import type { ShieldedWallet, WalletLike } from "@agent-shield/solana";
import { ENV_KEYS, AgentShieldElizaConfig } from "./types";

/** Minimal wallet wrapper around a Keypair (no Anchor dependency). */
class KeypairWallet implements WalletLike {
  publicKey: PublicKey;
  constructor(private keypair: Keypair) {
    this.publicKey = keypair.publicKey;
  }
  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this.keypair);
    } else {
      (tx as VersionedTransaction).sign([this.keypair]);
    }
    return tx;
  }
}

const walletCache = new WeakMap<
  object,
  { wallet: ShieldedWallet; publicKey: PublicKey }
>();

/**
 * Reads AgentShield config from ElizaOS runtime settings.
 */
export function getConfig(runtime: any): AgentShieldElizaConfig {
  const get = (key: string): string => {
    const val = runtime.getSetting(key);
    if (!val)
      throw new Error(`AgentShield: missing required setting '${key}'`);
    return val;
  };

  const blockRaw = runtime.getSetting(ENV_KEYS.BLOCK_UNKNOWN);
  const blockUnknown = blockRaw !== "false";

  return {
    maxSpend: runtime.getSetting(ENV_KEYS.MAX_SPEND) || undefined,
    blockUnknown,
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
  const bs58 = require("bs58");
  return Keypair.fromSecretKey(bs58.decode(raw));
}

/**
 * Gets or creates a ShieldedWallet for the given ElizaOS runtime.
 * Cached per runtime instance via WeakMap.
 */
export function getOrCreateShieldedWallet(runtime: any): {
  wallet: ShieldedWallet;
  publicKey: PublicKey;
} {
  const cached = walletCache.get(runtime);
  if (cached) return cached;

  const config = getConfig(runtime);
  const keypair = parseKeypair(config.walletPrivateKey);
  const innerWallet = new KeypairWallet(keypair);

  const shielded = shield(innerWallet, {
    maxSpend: config.maxSpend,
    blockUnknownPrograms: config.blockUnknown,
  });

  const result = { wallet: shielded, publicKey: keypair.publicKey };
  walletCache.set(runtime, result);
  return result;
}

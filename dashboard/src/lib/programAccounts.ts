import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type {
  AgentShield,
  AgentVaultAccount,
  PolicyConfigAccount,
  SpendTrackerAccount,
} from "@agent-shield/sdk";
import { getPolicyPDA, getTrackerPDA } from "@agent-shield/sdk";

export interface VaultWithMeta {
  address: PublicKey;
  vault: AgentVaultAccount;
  policy?: PolicyConfigAccount;
  tracker?: SpendTrackerAccount;
}

export async function fetchAllVaults(
  program: Program<AgentShield>
): Promise<VaultWithMeta[]> {
  const allVaults = await program.account.agentVault.all();

  const vaultEntries: VaultWithMeta[] = allVaults.map((v) => ({
    address: v.publicKey,
    vault: v.account as unknown as AgentVaultAccount,
  }));

  // Batch fetch policies and trackers
  const policyAddrs = vaultEntries.map(
    (v) => getPolicyPDA(v.address, program.programId)[0]
  );
  const trackerAddrs = vaultEntries.map(
    (v) => getTrackerPDA(v.address, program.programId)[0]
  );

  const [policyInfos, trackerInfos] = await Promise.all([
    batchGetAccounts(program.provider.connection, policyAddrs),
    batchGetAccounts(program.provider.connection, trackerAddrs),
  ]);

  for (let i = 0; i < vaultEntries.length; i++) {
    if (policyInfos[i]) {
      try {
        vaultEntries[i].policy = program.coder.accounts.decode(
          "policyConfig",
          policyInfos[i]!.data
        ) as unknown as PolicyConfigAccount;
      } catch {}
    }
    if (trackerInfos[i]) {
      try {
        vaultEntries[i].tracker = program.coder.accounts.decode(
          "spendTracker",
          trackerInfos[i]!.data
        ) as unknown as SpendTrackerAccount;
      } catch {}
    }
  }

  return vaultEntries;
}

export async function fetchVaultsByOwner(
  program: Program<AgentShield>,
  owner: PublicKey
): Promise<VaultWithMeta[]> {
  const vaults = await program.account.agentVault.all([
    { memcmp: { offset: 8, bytes: owner.toBase58() } },
  ]);

  return vaults.map((v) => ({
    address: v.publicKey,
    vault: v.account as unknown as AgentVaultAccount,
  }));
}

async function batchGetAccounts(
  connection: Connection,
  addresses: PublicKey[],
  batchSize = 100
) {
  const results: (import("@solana/web3.js").AccountInfo<Buffer> | null)[] =
    [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const infos = await connection.getMultipleAccountsInfo(batch);
    results.push(...infos);
  }
  return results;
}

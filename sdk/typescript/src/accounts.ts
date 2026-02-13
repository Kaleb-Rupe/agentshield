import { PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import type {
  AgentShield,
  AgentVaultAccount,
  PolicyConfigAccount,
  SpendTrackerAccount,
  SessionAuthorityAccount,
} from "./types";
import { AGENT_SHIELD_PROGRAM_ID } from "./types";

// --- PDA Derivation ---

export function getVaultPDA(
  owner: PublicKey,
  vaultId: BN,
  programId: PublicKey = AGENT_SHIELD_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault"),
      owner.toBuffer(),
      vaultId.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

export function getPolicyPDA(
  vault: PublicKey,
  programId: PublicKey = AGENT_SHIELD_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), vault.toBuffer()],
    programId
  );
}

export function getTrackerPDA(
  vault: PublicKey,
  programId: PublicKey = AGENT_SHIELD_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("tracker"), vault.toBuffer()],
    programId
  );
}

export function getSessionPDA(
  vault: PublicKey,
  agent: PublicKey,
  programId: PublicKey = AGENT_SHIELD_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("session"), vault.toBuffer(), agent.toBuffer()],
    programId
  );
}

// --- Account Fetching ---

export async function fetchVault(
  program: Program<AgentShield>,
  owner: PublicKey,
  vaultId: BN
): Promise<AgentVaultAccount> {
  const [vaultPda] = getVaultPDA(owner, vaultId, program.programId);
  return (await program.account.AgentVault.fetch(
    vaultPda
  )) as unknown as AgentVaultAccount;
}

export async function fetchPolicy(
  program: Program<AgentShield>,
  vault: PublicKey
): Promise<PolicyConfigAccount> {
  const [policyPda] = getPolicyPDA(vault, program.programId);
  return (await program.account.PolicyConfig.fetch(
    policyPda
  )) as unknown as PolicyConfigAccount;
}

export async function fetchTracker(
  program: Program<AgentShield>,
  vault: PublicKey
): Promise<SpendTrackerAccount> {
  const [trackerPda] = getTrackerPDA(vault, program.programId);
  return (await program.account.SpendTracker.fetch(
    trackerPda
  )) as unknown as SpendTrackerAccount;
}

export async function fetchSession(
  program: Program<AgentShield>,
  vault: PublicKey,
  agent: PublicKey
): Promise<SessionAuthorityAccount> {
  const [sessionPda] = getSessionPDA(vault, agent, program.programId);
  return (await program.account.SessionAuthority.fetch(
    sessionPda
  )) as unknown as SessionAuthorityAccount;
}

export async function fetchVaultByAddress(
  program: Program<AgentShield>,
  address: PublicKey
): Promise<AgentVaultAccount> {
  return (await program.account.AgentVault.fetch(
    address
  )) as unknown as AgentVaultAccount;
}

export async function fetchPolicyByAddress(
  program: Program<AgentShield>,
  address: PublicKey
): Promise<PolicyConfigAccount> {
  return (await program.account.PolicyConfig.fetch(
    address
  )) as unknown as PolicyConfigAccount;
}

export async function fetchTrackerByAddress(
  program: Program<AgentShield>,
  address: PublicKey
): Promise<SpendTrackerAccount> {
  return (await program.account.SpendTracker.fetch(
    address
  )) as unknown as SpendTrackerAccount;
}

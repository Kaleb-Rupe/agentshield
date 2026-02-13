import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type {
  AgentShield,
  InitializeVaultParams,
  UpdatePolicyParams,
  AuthorizeParams,
  ActionType,
} from "./types";
import { getVaultPDA, getPolicyPDA, getTrackerPDA, getSessionPDA } from "./accounts";

export function buildInitializeVault(
  program: Program<AgentShield>,
  owner: PublicKey,
  params: InitializeVaultParams
) {
  const [vault] = getVaultPDA(owner, params.vaultId, program.programId);
  const [policy] = getPolicyPDA(vault, program.programId);
  const [tracker] = getTrackerPDA(vault, program.programId);

  return program.methods
    .initializeVault(
      params.vaultId,
      params.dailySpendingCap,
      params.maxTransactionSize,
      params.allowedTokens,
      params.allowedProtocols,
      params.maxLeverageBps,
      params.maxConcurrentPositions,
      params.developerFeeRate ?? 0
    )
    .accounts({
      owner,
      vault,
      policy,
      tracker,
      feeDestination: params.feeDestination,
      systemProgram: SystemProgram.programId,
    } as any);
}

export function buildDepositFunds(
  program: Program<AgentShield>,
  owner: PublicKey,
  vault: PublicKey,
  mint: PublicKey,
  amount: BN
) {
  const ownerTokenAccount = getAssociatedTokenAddressSync(mint, owner);
  const vaultTokenAccount = getAssociatedTokenAddressSync(mint, vault, true);

  return program.methods.depositFunds(amount).accounts({
    owner,
    vault,
    mint,
    ownerTokenAccount,
    vaultTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  } as any);
}

export function buildRegisterAgent(
  program: Program<AgentShield>,
  owner: PublicKey,
  vault: PublicKey,
  agent: PublicKey
) {
  return program.methods.registerAgent(agent).accounts({
    owner,
    vault,
  } as any);
}

export function buildUpdatePolicy(
  program: Program<AgentShield>,
  owner: PublicKey,
  vault: PublicKey,
  params: UpdatePolicyParams
) {
  const [policy] = getPolicyPDA(vault, program.programId);

  return program.methods
    .updatePolicy(
      params.dailySpendingCap ?? null,
      params.maxTransactionSize ?? null,
      params.allowedTokens ?? null,
      params.allowedProtocols ?? null,
      params.maxLeverageBps ?? null,
      params.canOpenPositions ?? null,
      params.maxConcurrentPositions ?? null,
      params.developerFeeRate ?? null
    )
    .accounts({
      owner,
      vault,
      policy,
    } as any);
}

export function buildValidateAndAuthorize(
  program: Program<AgentShield>,
  agent: PublicKey,
  vault: PublicKey,
  params: AuthorizeParams
) {
  const [policy] = getPolicyPDA(vault, program.programId);
  const [tracker] = getTrackerPDA(vault, program.programId);
  const [session] = getSessionPDA(vault, agent, program.programId);

  return program.methods
    .validateAndAuthorize(
      params.actionType as any,
      params.tokenMint,
      params.amount,
      params.targetProtocol,
      params.leverageBps ?? null
    )
    .accounts({
      agent,
      vault,
      policy,
      tracker,
      session,
      systemProgram: SystemProgram.programId,
    } as any);
}

export function buildFinalizeSession(
  program: Program<AgentShield>,
  payer: PublicKey,
  vault: PublicKey,
  agent: PublicKey,
  success: boolean,
  vaultTokenAccount?: PublicKey | null,
  feeDestinationTokenAccount?: PublicKey | null,
  protocolTreasuryTokenAccount?: PublicKey | null
) {
  const [policy] = getPolicyPDA(vault, program.programId);
  const [tracker] = getTrackerPDA(vault, program.programId);
  const [session] = getSessionPDA(vault, agent, program.programId);

  return program.methods.finalizeSession(success).accounts({
    payer,
    vault,
    policy,
    tracker,
    session,
    sessionRentRecipient: agent,
    vaultTokenAccount: vaultTokenAccount ?? null,
    feeDestinationTokenAccount: feeDestinationTokenAccount ?? null,
    protocolTreasuryTokenAccount: protocolTreasuryTokenAccount ?? null,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  } as any);
}

export function buildRevokeAgent(
  program: Program<AgentShield>,
  owner: PublicKey,
  vault: PublicKey
) {
  return program.methods.revokeAgent().accounts({
    owner,
    vault,
  } as any);
}

export function buildReactivateVault(
  program: Program<AgentShield>,
  owner: PublicKey,
  vault: PublicKey,
  newAgent?: PublicKey | null
) {
  return program.methods.reactivateVault(newAgent ?? null).accounts({
    owner,
    vault,
  } as any);
}

export function buildWithdrawFunds(
  program: Program<AgentShield>,
  owner: PublicKey,
  vault: PublicKey,
  mint: PublicKey,
  amount: BN
) {
  const vaultTokenAccount = getAssociatedTokenAddressSync(mint, vault, true);
  const ownerTokenAccount = getAssociatedTokenAddressSync(mint, owner);

  return program.methods.withdrawFunds(amount).accounts({
    owner,
    vault,
    mint,
    vaultTokenAccount,
    ownerTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  } as any);
}

export function buildCloseVault(
  program: Program<AgentShield>,
  owner: PublicKey,
  vault: PublicKey
) {
  const [policy] = getPolicyPDA(vault, program.programId);
  const [tracker] = getTrackerPDA(vault, program.programId);

  return program.methods.closeVault().accounts({
    owner,
    vault,
    policy,
    tracker,
    systemProgram: SystemProgram.programId,
  } as any);
}

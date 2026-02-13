import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import type { AgentShield } from "./idl";

export type { AgentShield };

export const AGENT_SHIELD_PROGRAM_ID = new PublicKey(
  "4ZeVCqnjUgUtFrHHPG7jELUxvJeoVGHhGNgPrhBPwrHL"
);

// Fee constants matching on-chain values
export const FEE_RATE_DENOMINATOR = 1_000_000;
export const PROTOCOL_FEE_RATE = 20; // 0.2 BPS
export const MAX_DEVELOPER_FEE_RATE = 50; // 0.5 BPS
export const PROTOCOL_TREASURY = new PublicKey(
  "ASHie1dFTnDSnrHMPGmniJhMgfJVGPm3rAaEPnrtWDiT"
);

// Re-export IDL types for convenience
export type AgentVaultAccount = {
  owner: PublicKey;
  agent: PublicKey;
  feeDestination: PublicKey;
  vaultId: BN;
  status: VaultStatus;
  bump: number;
  createdAt: BN;
  totalTransactions: BN;
  totalVolume: BN;
  openPositions: number;
  totalFeesCollected: BN;
};

export type PolicyConfigAccount = {
  vault: PublicKey;
  dailySpendingCap: BN;
  maxTransactionSize: BN;
  allowedTokens: PublicKey[];
  allowedProtocols: PublicKey[];
  maxLeverageBps: number;
  canOpenPositions: boolean;
  maxConcurrentPositions: number;
  developerFeeRate: number;
  bump: number;
};

export type SpendTrackerAccount = {
  vault: PublicKey;
  rollingSpends: SpendEntry[];
  recentTransactions: TransactionRecord[];
  bump: number;
};

export type SpendEntry = {
  tokenMint: PublicKey;
  amountSpent: BN;
  timestamp: BN;
};

export type TransactionRecord = {
  timestamp: BN;
  actionType: ActionType;
  tokenMint: PublicKey;
  amount: BN;
  protocol: PublicKey;
  success: boolean;
  slot: BN;
};

export type SessionAuthorityAccount = {
  vault: PublicKey;
  agent: PublicKey;
  authorized: boolean;
  authorizedAmount: BN;
  authorizedToken: PublicKey;
  authorizedProtocol: PublicKey;
  actionType: ActionType;
  expiresAtSlot: BN;
  bump: number;
};

// Enum types matching the on-chain representation
export type VaultStatus =
  | { active: Record<string, never> }
  | { frozen: Record<string, never> }
  | { closed: Record<string, never> };

export type ActionType =
  | { swap: Record<string, never> }
  | { openPosition: Record<string, never> }
  | { closePosition: Record<string, never> }
  | { increasePosition: Record<string, never> }
  | { decreasePosition: Record<string, never> }
  | { deposit: Record<string, never> }
  | { withdraw: Record<string, never> };

// SDK param types for instruction builders
export interface InitializeVaultParams {
  vaultId: BN;
  dailySpendingCap: BN;
  maxTransactionSize: BN;
  allowedTokens: PublicKey[];
  allowedProtocols: PublicKey[];
  maxLeverageBps: number;
  maxConcurrentPositions: number;
  feeDestination: PublicKey;
  developerFeeRate?: number;
}

export interface UpdatePolicyParams {
  dailySpendingCap?: BN | null;
  maxTransactionSize?: BN | null;
  allowedTokens?: PublicKey[] | null;
  allowedProtocols?: PublicKey[] | null;
  maxLeverageBps?: number | null;
  canOpenPositions?: boolean | null;
  maxConcurrentPositions?: number | null;
  developerFeeRate?: number | null;
}

export interface AuthorizeParams {
  actionType: ActionType;
  tokenMint: PublicKey;
  amount: BN;
  targetProtocol: PublicKey;
  leverageBps?: number | null;
}

export interface ComposeActionParams {
  vault: PublicKey;
  owner: PublicKey;
  vaultId: BN;
  agent: PublicKey;
  actionType: ActionType;
  tokenMint: PublicKey;
  amount: BN;
  targetProtocol: PublicKey;
  leverageBps?: number | null;
  /** The DeFi instruction(s) to sandwich between validate and finalize */
  defiInstructions: import("@solana/web3.js").TransactionInstruction[];
  /** Whether the finalize step should report success (default: true) */
  success?: boolean;
  /** Optional: vault token account for fee deduction */
  vaultTokenAccount?: PublicKey | null;
  /** Optional: fee destination token account */
  feeDestinationTokenAccount?: PublicKey | null;
  /** Optional: protocol treasury token account for protocol fee */
  protocolTreasuryTokenAccount?: PublicKey | null;
}

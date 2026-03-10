import { z } from "zod";
import type { ResolvedConfig } from "../types";

export const pauseResumeSchema = z.object({
  action: z
    .enum(["pause", "resume"])
    .describe("Whether to pause or resume Phalnx enforcement."),
});

export type PauseResumeInput = z.infer<typeof pauseResumeSchema>;

/**
 * Client-side (soft) pause — bypassable, no on-chain enforcement.
 * For on-chain (hard) pause, use onChainPauseAgent / onChainUnpauseAgent.
 */
export async function pauseResume(
  _agent: any,
  config: ResolvedConfig,
  input: PauseResumeInput,
): Promise<string> {
  if (input.action === "pause") {
    config.wallet.pause();
    return "Phalnx enforcement paused (client-side). Transactions will pass through without policy checks.";
  } else {
    config.wallet.resume();
    return "Phalnx enforcement resumed (client-side). Policy checks are active.";
  }
}

// ─── On-Chain Pause (Protocol-Enforced) ─────────────────────

export const onChainPauseAgentSchema = z.object({
  vault: z.string().describe("Vault PDA address (base58)"),
  agent: z.string().describe("Agent public key to pause (base58)"),
});

export type OnChainPauseAgentInput = z.infer<typeof onChainPauseAgentSchema>;

/**
 * On-chain (hard) pause — protocol-enforced, not bypassable.
 * Requires vault owner signature.
 */
export async function onChainPauseAgent(
  _agent: any,
  config: ResolvedConfig,
  input: OnChainPauseAgentInput,
): Promise<string> {
  const { PublicKey } = await import("@solana/web3.js");
  const client = (config as any).client;
  if (!client) {
    return "Error: PhalnxClient not available. On-chain pause requires SDK client.";
  }
  const sig = await client.pauseAgent(
    new PublicKey(input.vault),
    new PublicKey(input.agent),
  );
  return `Agent ${input.agent} paused on-chain (protocol-enforced). Tx: ${sig}`;
}

export const onChainUnpauseAgentSchema = z.object({
  vault: z.string().describe("Vault PDA address (base58)"),
  agent: z.string().describe("Agent public key to unpause (base58)"),
});

export type OnChainUnpauseAgentInput = z.infer<
  typeof onChainUnpauseAgentSchema
>;

/**
 * On-chain unpause — restores agent's ability to execute actions.
 * Requires vault owner signature.
 */
export async function onChainUnpauseAgent(
  _agent: any,
  config: ResolvedConfig,
  input: OnChainUnpauseAgentInput,
): Promise<string> {
  const { PublicKey } = await import("@solana/web3.js");
  const client = (config as any).client;
  if (!client) {
    return "Error: PhalnxClient not available. On-chain unpause requires SDK client.";
  }
  const sig = await client.unpauseAgent(
    new PublicKey(input.vault),
    new PublicKey(input.agent),
  );
  return `Agent ${input.agent} unpaused on-chain. Tx: ${sig}`;
}

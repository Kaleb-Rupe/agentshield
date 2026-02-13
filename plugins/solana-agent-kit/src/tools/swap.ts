import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getOrCreateClient } from "../client-factory";
import { AgentShieldPluginConfig } from "../types";

export const swapSchema = z.object({
  inputMint: z.string().describe("Input token mint address"),
  outputMint: z.string().describe("Output token mint address"),
  amount: z.string().describe("Amount to swap in base units (lamports/smallest denomination)"),
  slippageBps: z
    .number()
    .optional()
    .default(50)
    .describe("Slippage tolerance in basis points (default: 50 = 0.5%)"),
});

export type SwapInput = z.infer<typeof swapSchema>;

export async function swap(
  agent: any,
  config: AgentShieldPluginConfig,
  input: SwapInput
): Promise<string> {
  const client = getOrCreateClient(agent, config);

  const txSig = await client.executeJupiterSwap({
    owner: config.vaultOwner,
    vaultId: config.vaultId,
    agent: agent.wallet.publicKey,
    inputMint: new PublicKey(input.inputMint),
    outputMint: new PublicKey(input.outputMint),
    amount: new BN(input.amount),
    slippageBps: input.slippageBps,
  });

  return `Swap executed successfully.\nTransaction: ${txSig}`;
}

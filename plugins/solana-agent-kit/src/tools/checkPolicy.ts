import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getOrCreateClient } from "../client-factory";
import { AgentShieldPluginConfig } from "../types";

export const checkPolicySchema = z.object({
  vaultAddress: z
    .string()
    .optional()
    .describe("Optional vault PDA address override. Uses configured vault if omitted."),
});

export type CheckPolicyInput = z.infer<typeof checkPolicySchema>;

export async function checkPolicy(
  agent: any,
  config: AgentShieldPluginConfig,
  input: CheckPolicyInput
): Promise<string> {
  const client = getOrCreateClient(agent, config);

  let vaultPda: PublicKey;
  if (input.vaultAddress) {
    vaultPda = new PublicKey(input.vaultAddress);
  } else {
    [vaultPda] = client.getVaultPDA(config.vaultOwner, config.vaultId);
  }

  const policy = await client.fetchPolicy(vaultPda);

  const tokenList = policy.allowedTokens.map((t) => t.toBase58()).join(", ") || "none";
  const protocolList = policy.allowedProtocols.map((p) => p.toBase58()).join(", ") || "none";

  return [
    `=== Vault Policy ===`,
    `Daily Spending Cap: ${policy.dailySpendingCap.toString()} lamports`,
    `Max Transaction Size: ${policy.maxTransactionSize.toString()} lamports`,
    `Allowed Tokens: ${tokenList}`,
    `Allowed Protocols: ${protocolList}`,
    `Max Leverage: ${policy.maxLeverageBps} bps (${(policy.maxLeverageBps / 100).toFixed(1)}x)`,
    `Can Open Positions: ${policy.canOpenPositions}`,
    `Max Concurrent Positions: ${policy.maxConcurrentPositions}`,
    `Developer Fee Rate: ${policy.developerFeeRate} (${(policy.developerFeeRate / 10000).toFixed(4)}%)`,
  ].join("\n");
}

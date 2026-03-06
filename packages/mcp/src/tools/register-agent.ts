import { z } from "zod";
import type { PhalnxClient } from "@phalnx/sdk";
import { toPublicKey } from "../utils";
import { formatError } from "../errors";

export const registerAgentSchema = z.object({
  vault: z.string().describe("Vault PDA address (base58)"),
  agent: z.string().describe("Agent public key to register (base58)"),
  permissions: z
    .string()
    .optional()
    .describe(
      "Permission bitmask as a decimal string. Omit for full permissions (2097151). " +
        "Bit 0 = Swap, Bits 1-4 = Perps (Open/Close/Increase/Decrease), Bit 7 = Transfer, " +
        "Bits 18-20 = Escrow (Create/Settle/Refund).",
    ),
  spendingLimitUsd: z
    .string()
    .optional()
    .describe(
      "Per-agent rolling 24h spending limit in USD (6 decimals). " +
        "0 or omitted = no per-agent limit (vault-wide cap still applies). " +
        "Example: '500000000' = $500/day.",
    ),
});

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;

export async function registerAgent(
  client: PhalnxClient,
  input: RegisterAgentInput,
): Promise<string> {
  try {
    const { BN } = await import("@coral-xyz/anchor");
    const permissions = new BN(input.permissions ?? "2097151");
    const spendingLimitUsd = new BN(input.spendingLimitUsd ?? "0");
    const sig = await client.registerAgent(
      toPublicKey(input.vault),
      toPublicKey(input.agent),
      permissions,
      spendingLimitUsd,
    );

    return [
      "## Agent Registered",
      `- **Vault:** ${input.vault}`,
      `- **Agent:** ${input.agent}`,
      `- **Permissions:** ${permissions.toString()}`,
      `- **Spending Limit:** ${spendingLimitUsd.isZero() ? "Unlimited (vault-wide cap only)" : `$${(parseInt(spendingLimitUsd.toString()) / 1_000_000).toFixed(2)}/day`}`,
      `- **Transaction:** ${sig}`,
      "",
      "The agent can now execute trades through this vault within the vault's policy limits " +
        "and the granted permissions.",
    ].join("\n");
  } catch (error) {
    return formatError(error);
  }
}

export const registerAgentTool = {
  name: "shield_register_agent",
  description:
    "Register an agent signing key to an Phalnx vault with specific permissions. " +
    "Up to 10 agents per vault. Omit permissions for full access.",
  schema: registerAgentSchema,
  handler: registerAgent,
};

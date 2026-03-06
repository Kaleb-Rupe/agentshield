import { z } from "zod";
import type { PhalnxClient } from "@phalnx/sdk";
import { toPublicKey } from "../utils";
import { formatError } from "../errors";

export const updateAgentPermissionsSchema = z.object({
  vault: z.string().describe("Vault PDA address (base58)"),
  agent: z.string().describe("Agent public key (base58)"),
  permissions: z
    .string()
    .describe(
      "New permission bitmask as a decimal string. " +
        "Bit 0 = Swap, Bit 1 = OpenPosition, Bit 2 = ClosePosition, " +
        "Bit 3 = IncreasePosition, Bit 4 = DecreasePosition, " +
        "Bit 5 = Deposit, Bit 6 = Withdraw, Bit 7 = Transfer, " +
        "Bit 8 = AddCollateral, Bit 9 = RemoveCollateral, " +
        "Bit 10-12 = TriggerOrders, Bit 13-14 = LimitOrders, " +
        "Bit 15 = SwapAndOpen, Bit 16 = CloseAndSwap, " +
        "Bit 17 = SyncPositions, Bit 18 = CreateEscrow, " +
        "Bit 19 = SettleEscrow, Bit 20 = RefundEscrow. " +
        "Full permissions = 2097151.",
    ),
  spendingLimitUsd: z
    .string()
    .optional()
    .describe(
      "Per-agent rolling 24h spending limit in USD (6 decimals). " +
        "0 or omitted = no per-agent limit. Example: '500000000' = $500/day.",
    ),
});

export type UpdateAgentPermissionsInput = z.infer<
  typeof updateAgentPermissionsSchema
>;

export async function updateAgentPermissions(
  client: PhalnxClient,
  input: UpdateAgentPermissionsInput,
): Promise<string> {
  try {
    const { BN } = await import("@coral-xyz/anchor");
    const spendingLimitUsd = new BN(input.spendingLimitUsd ?? "0");
    const sig = await client.updateAgentPermissions(
      toPublicKey(input.vault),
      toPublicKey(input.agent),
      new BN(input.permissions),
      spendingLimitUsd,
    );

    return [
      "## Agent Permissions Updated",
      `- **Vault:** ${input.vault}`,
      `- **Agent:** ${input.agent}`,
      `- **New Permissions:** ${input.permissions}`,
      `- **Spending Limit:** ${spendingLimitUsd.isZero() ? "Unlimited" : `$${(parseInt(spendingLimitUsd.toString()) / 1_000_000).toFixed(2)}/day`}`,
      `- **Transaction:** ${sig}`,
    ].join("\n");
  } catch (error) {
    return formatError(error);
  }
}

export const updateAgentPermissionsTool = {
  name: "shield_update_agent_permissions",
  description:
    "Update the permission bitmask for a registered agent. " +
    "Controls which action types the agent can perform. Owner-only.",
  schema: updateAgentPermissionsSchema,
  handler: updateAgentPermissions,
};

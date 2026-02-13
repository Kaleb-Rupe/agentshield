import { getOrCreateClient } from "../client-factory";

/**
 * Policy Check Evaluator — runs after SHIELD actions and warns
 * if the vault is approaching its daily spending cap.
 */
export const policyCheckEvaluator = {
  name: "AGENT_SHIELD_POLICY_CHECK",
  description:
    "Post-action evaluator that checks spending against the daily cap " +
    "and warns if usage exceeds 80%.",
  similes: ["check spending limits", "policy warning"],

  validate: async (_runtime: any, message: any): Promise<boolean> => {
    // Only evaluate after shield actions
    const text = (message.content?.text || "").toLowerCase();
    return (
      text.includes("agentshield") ||
      text.includes("shield vault") ||
      text.includes("transaction:")
    );
  },

  handler: async (runtime: any, _message: any) => {
    try {
      const { client, vaultOwner, vaultId } = getOrCreateClient(runtime);
      const [vaultPda] = client.getVaultPDA(vaultOwner, vaultId);

      const tracker = await client.fetchTracker(vaultPda);
      const policy = await client.fetchPolicy(vaultPda);

      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - 24 * 60 * 60;

      let totalSpent = BigInt(0);
      for (const entry of tracker.rollingSpends) {
        if (entry.timestamp.toNumber() >= windowStart) {
          totalSpent += BigInt(entry.amountSpent.toString());
        }
      }

      const cap = BigInt(policy.dailySpendingCap.toString());
      if (cap === BigInt(0)) return null;

      const usagePct = Number((totalSpent * BigInt(100)) / cap);

      if (usagePct >= 80) {
        const remaining = cap > totalSpent ? cap - totalSpent : BigInt(0);
        return {
          text:
            `WARNING: AgentShield vault has used ${usagePct}% of the daily spending cap. ` +
            `Remaining budget: ${remaining.toString()} lamports. ` +
            `Consider reducing trade sizes or waiting for the rolling window to reset.`,
          action: "POLICY_WARNING",
        };
      }

      return null;
    } catch {
      // Silently fail — evaluators should not block the agent
      return null;
    }
  },

  examples: [
    {
      context: "Agent just executed a swap that pushed spending to 85% of daily cap",
      messages: [
        {
          user: "{{agent}}",
          content: {
            text: "Swap executed successfully through AgentShield vault.\nTransaction: 5xYz...",
          },
        },
      ],
      outcome:
        "WARNING: AgentShield vault has used 85% of the daily spending cap. " +
        "Remaining budget: 150000000 lamports.",
    },
  ],
};

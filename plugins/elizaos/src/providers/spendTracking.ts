import { getOrCreateClient } from "../client-factory";

/**
 * Spend Tracking Provider — injects rolling 24h spend data and
 * remaining budget into agent context.
 */
export const spendTrackingProvider = {
  name: "AGENT_SHIELD_SPEND_TRACKING",
  description: "Provides rolling 24h spending data and remaining budget for the AgentShield vault",

  get: async (runtime: any, _message: any, _state: any) => {
    try {
      const { client, vaultOwner, vaultId } = getOrCreateClient(runtime);
      const [vaultPda] = client.getVaultPDA(vaultOwner, vaultId);

      const tracker = await client.fetchTracker(vaultPda);
      const policy = await client.fetchPolicy(vaultPda);

      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - 24 * 60 * 60;

      // Sum active spends within the 24h window
      let totalSpent = BigInt(0);
      const spendByToken = new Map<string, bigint>();
      for (const entry of tracker.rollingSpends) {
        if (entry.timestamp.toNumber() >= windowStart) {
          const amount = BigInt(entry.amountSpent.toString());
          totalSpent += amount;
          const mint = entry.tokenMint.toBase58();
          spendByToken.set(mint, (spendByToken.get(mint) || BigInt(0)) + amount);
        }
      }

      const cap = BigInt(policy.dailySpendingCap.toString());
      const remaining = cap > totalSpent ? cap - totalSpent : BigInt(0);
      const usagePct = cap > BigInt(0) ? Number((totalSpent * BigInt(100)) / cap) : 0;

      const lines = [
        `AgentShield Spending (24h rolling):`,
        `  Total Spent: ${totalSpent.toString()} / ${cap.toString()} lamports (${usagePct}%)`,
        `  Remaining Budget: ${remaining.toString()} lamports`,
      ];

      for (const [mint, spent] of spendByToken.entries()) {
        lines.push(`  ${mint.slice(0, 8)}...: ${spent.toString()} lamports`);
      }

      const text = lines.join("\n");

      return {
        text,
        values: {
          totalSpent24h: totalSpent.toString(),
          dailyCap: cap.toString(),
          remainingBudget: remaining.toString(),
          usagePercent: usagePct.toString(),
        },
      };
    } catch (error: any) {
      return {
        text: `AgentShield: Unable to fetch spend data — ${error.message}`,
        values: {},
      };
    }
  },
};

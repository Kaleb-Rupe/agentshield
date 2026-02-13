import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getOrCreateClient } from "../client-factory";
import { AgentShieldPluginConfig } from "../types";

export const checkSpendingSchema = z.object({
  vaultAddress: z
    .string()
    .optional()
    .describe("Optional vault PDA address override. Uses configured vault if omitted."),
});

export type CheckSpendingInput = z.infer<typeof checkSpendingSchema>;

export async function checkSpending(
  agent: any,
  config: AgentShieldPluginConfig,
  input: CheckSpendingInput
): Promise<string> {
  const client = getOrCreateClient(agent, config);

  let vaultPda: PublicKey;
  if (input.vaultAddress) {
    vaultPda = new PublicKey(input.vaultAddress);
  } else {
    [vaultPda] = client.getVaultPDA(config.vaultOwner, config.vaultId);
  }

  const tracker = await client.fetchTracker(vaultPda);
  const policy = await client.fetchPolicy(vaultPda);

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 24 * 60 * 60;

  // Calculate rolling 24h spend per token
  const spendByToken = new Map<string, bigint>();
  for (const entry of tracker.rollingSpends) {
    if (entry.timestamp.toNumber() >= windowStart) {
      const mint = entry.tokenMint.toBase58();
      const prev = spendByToken.get(mint) || BigInt(0);
      spendByToken.set(mint, prev + BigInt(entry.amountSpent.toString()));
    }
  }

  const cap = policy.dailySpendingCap.toString();
  const lines = [
    `=== Spending Tracker ===`,
    `Daily Cap: ${cap} lamports`,
    `Rolling 24h Window: ${tracker.rollingSpends.length} entries`,
    ``,
    `--- Active Spend by Token (24h) ---`,
  ];

  if (spendByToken.size === 0) {
    lines.push("No spending in the last 24 hours.");
  } else {
    for (const [mint, spent] of spendByToken.entries()) {
      const capBN = BigInt(cap);
      const pct = capBN > BigInt(0) ? Number((spent * BigInt(100)) / capBN) : 0;
      lines.push(`  ${mint}: ${spent.toString()} lamports (${pct}% of cap)`);
    }
  }

  lines.push("", `--- Recent Transactions (last ${tracker.recentTransactions.length}) ---`);

  const recent = tracker.recentTransactions.slice(-5);
  for (const tx of recent) {
    const action = Object.keys(tx.actionType)[0];
    const status = tx.success ? "OK" : "FAIL";
    lines.push(
      `  [${status}] ${action} | ${tx.amount.toString()} lamports | slot ${tx.slot.toString()}`
    );
  }

  return lines.join("\n");
}

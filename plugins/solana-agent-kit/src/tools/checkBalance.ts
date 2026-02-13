import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getOrCreateClient } from "../client-factory";
import { AgentShieldPluginConfig } from "../types";

export const checkBalanceSchema = z.object({
  vaultAddress: z
    .string()
    .optional()
    .describe("Optional vault PDA address override. Uses configured vault if omitted."),
});

export type CheckBalanceInput = z.infer<typeof checkBalanceSchema>;

export async function checkBalance(
  agent: any,
  config: AgentShieldPluginConfig,
  input: CheckBalanceInput
): Promise<string> {
  const client = getOrCreateClient(agent, config);

  let vaultPda: PublicKey;
  if (input.vaultAddress) {
    vaultPda = new PublicKey(input.vaultAddress);
  } else {
    [vaultPda] = client.getVaultPDA(config.vaultOwner, config.vaultId);
  }

  const vault = await client.fetchVaultByAddress(vaultPda);

  const solBalance = await (client as any).connection.getBalance(vaultPda);

  return [
    `=== Vault Balances ===`,
    `Vault Address: ${vaultPda.toBase58()}`,
    `Owner: ${vault.owner.toBase58()}`,
    `Agent: ${vault.agent.toBase58()}`,
    `Status: ${Object.keys(vault.status)[0]}`,
    `SOL Balance: ${(solBalance / 1e9).toFixed(4)} SOL`,
    `Total Transactions: ${vault.totalTransactions.toString()}`,
    `Total Volume: ${vault.totalVolume.toString()} lamports`,
    `Open Positions: ${vault.openPositions}`,
    `Total Fees Collected: ${vault.totalFeesCollected.toString()} lamports`,
  ].join("\n");
}

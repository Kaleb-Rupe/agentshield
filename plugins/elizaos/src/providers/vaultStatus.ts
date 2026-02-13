import { getOrCreateClient } from "../client-factory";

/**
 * Vault Status Provider — injects vault status and policy summary
 * into every agent conversation turn.
 */
export const vaultStatusProvider = {
  name: "AGENT_SHIELD_VAULT_STATUS",
  description: "Provides current AgentShield vault status, owner, agent, and policy summary",

  get: async (runtime: any, _message: any, _state: any) => {
    try {
      const { client, vaultOwner, vaultId } = getOrCreateClient(runtime);
      const [vaultPda] = client.getVaultPDA(vaultOwner, vaultId);

      const vault = await client.fetchVaultByAddress(vaultPda);
      const policy = await client.fetchPolicy(vaultPda);

      const status = Object.keys(vault.status)[0];
      const tokenCount = policy.allowedTokens.length;
      const protocolCount = policy.allowedProtocols.length;

      const text = [
        `AgentShield Vault: ${vaultPda.toBase58()}`,
        `Status: ${status}`,
        `Owner: ${vault.owner.toBase58()}`,
        `Agent: ${vault.agent.toBase58()}`,
        `Daily Cap: ${policy.dailySpendingCap.toString()} lamports`,
        `Max Tx Size: ${policy.maxTransactionSize.toString()} lamports`,
        `Whitelisted: ${tokenCount} tokens, ${protocolCount} protocols`,
        `Max Leverage: ${(policy.maxLeverageBps / 100).toFixed(1)}x`,
        `Positions: ${vault.openPositions}/${policy.maxConcurrentPositions}`,
        `Developer Fee Rate: ${(policy.developerFeeRate / 10000).toFixed(4)}%`,
      ].join("\n");

      return {
        text,
        values: {
          vaultAddress: vaultPda.toBase58(),
          vaultStatus: status,
          dailySpendingCap: policy.dailySpendingCap.toString(),
          maxTransactionSize: policy.maxTransactionSize.toString(),
          openPositions: vault.openPositions.toString(),
          maxPositions: policy.maxConcurrentPositions.toString(),
        },
      };
    } catch (error: any) {
      return {
        text: `AgentShield: Unable to fetch vault status — ${error.message}`,
        values: {},
      };
    }
  },
};

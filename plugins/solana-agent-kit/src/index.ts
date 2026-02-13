import { AgentShieldPluginConfig } from "./types";
import {
  swap, swapSchema,
  openPosition, openPositionSchema,
  closePosition, closePositionSchema,
  checkPolicy, checkPolicySchema,
  checkBalance, checkBalanceSchema,
  checkSpending, checkSpendingSchema,
} from "./tools";

export { AgentShieldPluginConfig } from "./types";
export { getOrCreateClient } from "./client-factory";
export * from "./tools";

/**
 * Creates the AgentShield plugin for Solana Agent Kit.
 *
 * Usage:
 * ```ts
 * import { createAgentShieldPlugin } from "@agent-shield/plugin-solana-agent-kit";
 *
 * const plugin = createAgentShieldPlugin({
 *   vaultOwner: ownerPubkey,
 *   vaultId: new BN(1),
 * });
 *
 * const agent = new SolanaAgentKit(wallet, rpcUrl, {
 *   plugins: [plugin],
 * });
 * ```
 */
export function createAgentShieldPlugin(config: AgentShieldPluginConfig) {
  return {
    name: "agent-shield",
    description:
      "AgentShield — Permission-guarded DeFi vault for AI agents on Solana. " +
      "Routes swaps through Jupiter and perp trades through Flash Trade, " +
      "enforcing spending caps, token whitelists, and leverage limits.",

    methods: {
      shield_swap: {
        description:
          "Execute a token swap through Jupiter, routed through the AgentShield vault " +
          "with permission checks and spending limits enforced.",
        schema: swapSchema,
        handler: (agent: any, input: any) => swap(agent, config, input),
      },
      shield_open_position: {
        description:
          "Open a leveraged perpetual position on Flash Trade through the AgentShield vault. " +
          "Enforces leverage limits and position count caps.",
        schema: openPositionSchema,
        handler: (agent: any, input: any) => openPosition(agent, config, input),
      },
      shield_close_position: {
        description:
          "Close an existing perpetual position on Flash Trade through the AgentShield vault.",
        schema: closePositionSchema,
        handler: (agent: any, input: any) => closePosition(agent, config, input),
      },
      shield_check_policy: {
        description:
          "Read the current vault policy: spending caps, allowed tokens/protocols, " +
          "leverage limits, and fee configuration.",
        schema: checkPolicySchema,
        handler: (agent: any, input: any) => checkPolicy(agent, config, input),
      },
      shield_check_balance: {
        description:
          "Read vault balances, status, and high-level statistics (total volume, " +
          "open positions, fees collected).",
        schema: checkBalanceSchema,
        handler: (agent: any, input: any) => checkBalance(agent, config, input),
      },
      shield_check_spending: {
        description:
          "Read the rolling 24-hour spending tracker: per-token spend vs daily cap, " +
          "and recent transaction history.",
        schema: checkSpendingSchema,
        handler: (agent: any, input: any) => checkSpending(agent, config, input),
      },
    },

    initialize: (agent: any) => {
      // Eagerly create the client so connection errors surface early
      const { getOrCreateClient: getClient } = require("./client-factory");
      getClient(agent, config);
    },
  };
}

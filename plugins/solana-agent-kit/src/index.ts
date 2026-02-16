import { AgentShieldPluginConfig } from "./types";
import {
  status,
  statusSchema,
  updatePolicy,
  updatePolicySchema,
  pauseResume,
  pauseResumeSchema,
} from "./tools";

export { AgentShieldPluginConfig } from "./types";
export * from "./tools";

/**
 * Creates the AgentShield plugin for Solana Agent Kit.
 *
 * Usage:
 * ```ts
 * import { shield } from '@agent-shield/solana';
 * import { createAgentShieldPlugin } from '@agent-shield/plugin-solana-agent-kit';
 *
 * const protectedWallet = shield(wallet, { maxSpend: '500 USDC/day' });
 * const plugin = createAgentShieldPlugin({ wallet: protectedWallet });
 * const agent = new SolanaAgentKit(protectedWallet, RPC_URL, { plugins: [plugin] });
 * ```
 */
export function createAgentShieldPlugin(config: AgentShieldPluginConfig) {
  return {
    name: "agent-shield",
    description:
      "AgentShield — Client-side spending controls for AI agents on Solana. " +
      "Provides monitoring tools to check spending status, update policies, " +
      "and pause/resume enforcement. Shield wraps signing transparently.",

    methods: {
      shield_status: {
        description:
          "Check current shield status: spending vs limits, rate limit usage, " +
          "and whether enforcement is paused.",
        schema: statusSchema,
        handler: (agent: any, input: any) => status(agent, config, input),
      },
      shield_update_policy: {
        description:
          "Update shield policies at runtime. Can change spending limits " +
          "and unknown program blocking.",
        schema: updatePolicySchema,
        handler: (agent: any, input: any) =>
          updatePolicy(agent, config, input),
      },
      shield_pause_resume: {
        description:
          "Pause or resume shield enforcement. When paused, transactions " +
          "pass through without policy checks or spend recording.",
        schema: pauseResumeSchema,
        handler: (agent: any, input: any) =>
          pauseResume(agent, config, input),
      },
    },
  };
}

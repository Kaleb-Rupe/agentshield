import { swapAction, openPositionAction, closePositionAction } from "./actions";
import { vaultStatusProvider, spendTrackingProvider } from "./providers";
import { policyCheckEvaluator } from "./evaluators";

/**
 * AgentShield Plugin for ElizaOS.
 *
 * Provides:
 * - Actions: SHIELD_SWAP, SHIELD_OPEN_POSITION, SHIELD_CLOSE_POSITION
 * - Providers: vault status, spend tracking (injected into agent context)
 * - Evaluators: policy cap warning (runs after shield actions)
 *
 * Required environment variables:
 * - AGENT_SHIELD_VAULT_OWNER — vault owner public key
 * - AGENT_SHIELD_VAULT_ID — vault identifier
 * - SOLANA_RPC_URL — Solana RPC endpoint
 * - SOLANA_WALLET_PRIVATE_KEY — agent wallet key
 *
 * Optional:
 * - AGENT_SHIELD_PROGRAM_ID — custom program ID override
 */
export const agentShieldPlugin = {
  name: "agent-shield",
  description:
    "AgentShield — Permission-guarded DeFi vault for AI agents. " +
    "Routes swaps through Jupiter and perp trades through Flash Trade " +
    "with on-chain spending caps, token whitelists, and leverage limits.",

  actions: [
    swapAction,
    openPositionAction,
    closePositionAction,
  ],

  providers: [
    vaultStatusProvider,
    spendTrackingProvider,
  ],

  evaluators: [
    policyCheckEvaluator,
  ],
};

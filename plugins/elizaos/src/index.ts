export { agentShieldPlugin } from "./plugin";
export { ENV_KEYS, type AgentShieldElizaConfig } from "./types";
export { getOrCreateClient, getConfig } from "./client-factory";
export { swapAction, openPositionAction, closePositionAction } from "./actions";
export { vaultStatusProvider, spendTrackingProvider } from "./providers";
export { policyCheckEvaluator } from "./evaluators";

// Default export for ElizaOS plugin loader
import { agentShieldPlugin } from "./plugin";
export default agentShieldPlugin;

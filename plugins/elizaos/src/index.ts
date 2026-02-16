export { agentShieldPlugin } from "./plugin";
export { ENV_KEYS, type AgentShieldElizaConfig } from "./types";
export { getOrCreateShieldedWallet, getConfig } from "./client-factory";
export { statusAction, updatePolicyAction } from "./actions";
export { shieldStatusProvider, spendTrackingProvider } from "./providers";
export { policyCheckEvaluator } from "./evaluators";

// Default export for ElizaOS plugin loader
import { agentShieldPlugin } from "./plugin";
export default agentShieldPlugin;

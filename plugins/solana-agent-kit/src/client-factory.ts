import { AgentShieldClient } from "@agent-shield/sdk";
import { AgentShieldPluginConfig } from "./types";

/**
 * WeakMap-cached client factory. One AgentShieldClient per agent instance.
 * Uses WeakMap so clients are GC'd when the agent instance is collected.
 */
const clientCache = new WeakMap<object, AgentShieldClient>();

export function getOrCreateClient(
  agent: any,
  config: AgentShieldPluginConfig
): AgentShieldClient {
  const cached = clientCache.get(agent);
  if (cached) return cached;

  const connection = agent.connection;
  const wallet = agent.wallet;

  if (!connection || !wallet) {
    throw new Error(
      "AgentShield plugin requires agent to have 'connection' and 'wallet' properties"
    );
  }

  const client = new AgentShieldClient(
    connection,
    wallet,
    config.programId
  );

  clientCache.set(agent, client);
  return client;
}

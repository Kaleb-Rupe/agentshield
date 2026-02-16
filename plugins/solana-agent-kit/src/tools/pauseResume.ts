import { z } from "zod";
import type { AgentShieldPluginConfig } from "../types";

export const pauseResumeSchema = z.object({
  action: z
    .enum(["pause", "resume"])
    .describe("Whether to pause or resume shield enforcement."),
});

export type PauseResumeInput = z.infer<typeof pauseResumeSchema>;

export async function pauseResume(
  _agent: any,
  config: AgentShieldPluginConfig,
  input: PauseResumeInput,
): Promise<string> {
  if (input.action === "pause") {
    config.wallet.pause();
    return "Shield enforcement paused. Transactions will pass through without policy checks.";
  } else {
    config.wallet.resume();
    return "Shield enforcement resumed. Policy checks are active.";
  }
}

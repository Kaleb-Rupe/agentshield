import { getOrCreateShieldedWallet } from "../client-factory";

export const pauseResumeAction = {
  name: "SHIELD_PAUSE_RESUME",
  description:
    "Pause or resume Phalnx enforcement. When paused, transactions " +
    "pass through without policy checks or spend recording.",
  similes: [
    "pause shield",
    "resume shield",
    "pause enforcement",
    "resume enforcement",
    "disable shield",
    "enable shield",
  ],

  validate: async (runtime: any, message: any): Promise<boolean> => {
    try {
      await getOrCreateShieldedWallet(runtime);
    } catch {
      return false;
    }

    const text = (message.content?.text || "").toLowerCase();
    const keywords = [
      "pause shield",
      "resume shield",
      "pause enforcement",
      "resume enforcement",
      "disable shield",
      "enable shield",
    ];
    return keywords.some((kw) => text.includes(kw));
  },

  handler: async (
    runtime: any,
    message: any,
    _state: any,
    _options: any,
    callback: (response: any) => void,
  ) => {
    try {
      const { wallet } = await getOrCreateShieldedWallet(runtime);
      const text = (message.content?.text || "").toLowerCase();

      // Determine intent from message text
      const resumeKeywords = ["resume", "enable", "unpause", "activate"];
      const isResume = resumeKeywords.some((kw) => text.includes(kw));

      if (isResume) {
        wallet.resume();
        callback({
          text: "Phalnx enforcement resumed. Policy checks are active.",
        });
      } else {
        wallet.pause();
        callback({
          text: "Phalnx enforcement paused. Transactions will pass through without policy checks.",
        });
      }
    } catch (error: any) {
      callback({
        text: `Failed to pause/resume enforcement: ${error.message}`,
        error: true,
      });
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Pause the shield enforcement" },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Phalnx enforcement paused (client-side). Transactions will pass through without policy checks.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Resume shield enforcement" },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Phalnx enforcement resumed (client-side). Policy checks are active.",
        },
      },
    ],
  ],
};

/**
 * On-chain pause/unpause action.
 * Protocol-enforced — cannot be bypassed by the agent.
 * Requires vault owner signature.
 */
export const onChainPauseAction = {
  name: "SHIELD_ONCHAIN_PAUSE",
  description:
    "Pause or unpause an agent on-chain (protocol-enforced). " +
    "Unlike client-side pause, on-chain pause cannot be bypassed. " +
    "Requires vault owner signature.",
  similes: [
    "onchain pause agent",
    "onchain unpause agent",
    "hard pause agent",
    "hard unpause agent",
    "protocol pause",
    "protocol unpause",
  ],

  validate: async (runtime: any, message: any): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    const keywords = [
      "onchain pause",
      "onchain unpause",
      "hard pause",
      "hard unpause",
      "protocol pause",
      "protocol unpause",
    ];
    return keywords.some((kw) => text.includes(kw));
  },

  handler: async (
    runtime: any,
    message: any,
    _state: any,
    _options: any,
    callback: (response: any) => void,
  ) => {
    try {
      const { wallet } = await getOrCreateShieldedWallet(runtime);
      const text = (message.content?.text || "").toLowerCase();

      const client = (wallet as any).client;
      if (!client) {
        callback({
          text: "On-chain pause requires PhalnxClient. Ensure SDK client is configured.",
          error: true,
        });
        return;
      }

      const isUnpause = ["unpause", "resume", "enable"].some((kw) =>
        text.includes(kw),
      );

      // Extract vault and agent from message (user must provide these)
      callback({
        text: isUnpause
          ? "On-chain unpause requires vault and agent addresses. Use shield_unpause_agent tool with vault and agent parameters."
          : "On-chain pause requires vault and agent addresses. Use shield_pause_agent tool with vault and agent parameters.",
      });
    } catch (error: any) {
      callback({
        text: `Failed to process on-chain pause: ${error.message}`,
        error: true,
      });
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Hard pause the agent on-chain" },
      },
      {
        user: "{{agent}}",
        content: {
          text: "On-chain pause requires vault and agent addresses. Use shield_pause_agent tool with vault and agent parameters.",
        },
      },
    ],
  ],
};

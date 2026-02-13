import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getOrCreateClient } from "../client-factory";

export const swapAction = {
  name: "SHIELD_SWAP",
  description:
    "Execute a token swap through Jupiter, routed through the AgentShield vault " +
    "with permission checks and spending limits enforced on-chain.",
  similes: [
    "swap tokens through shield",
    "exchange tokens safely",
    "shielded swap",
    "protected token swap",
  ],

  validate: async (runtime: any, message: any): Promise<boolean> => {
    // Check required config exists
    try {
      getOrCreateClient(runtime);
    } catch {
      return false;
    }

    // Check message matches swap intent
    const text = (message.content?.text || "").toLowerCase();
    const swapKeywords = ["swap", "exchange", "trade", "convert"];
    return swapKeywords.some((kw) => text.includes(kw));
  },

  handler: async (
    runtime: any,
    message: any,
    _state: any,
    _options: any,
    callback: (response: any) => void
  ) => {
    try {
      const { client, vaultOwner, vaultId, agentKey } = getOrCreateClient(runtime);
      const params = message.content;

      if (!params.inputMint || !params.outputMint || !params.amount) {
        callback({
          text: "Missing required fields: inputMint, outputMint, and amount are required for a swap.",
          error: true,
        });
        return;
      }

      const txSig = await client.executeJupiterSwap({
        owner: vaultOwner,
        vaultId,
        agent: agentKey,
        inputMint: new PublicKey(params.inputMint),
        outputMint: new PublicKey(params.outputMint),
        amount: new BN(params.amount),
        slippageBps: params.slippageBps || 50,
      });

      callback({
        text: `Swap executed successfully through AgentShield vault.\nTransaction: ${txSig}`,
        data: { txSig },
      });
    } catch (error: any) {
      callback({
        text: `Swap failed: ${error.message}`,
        error: true,
      });
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Swap 1 SOL for USDC through the shield vault",
          inputMint: "So11111111111111111111111111111111111111112",
          outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: "1000000000",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Swap executed successfully through AgentShield vault.\nTransaction: 5xYz...",
        },
      },
    ],
  ],
};

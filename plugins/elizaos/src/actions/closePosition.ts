import { BN } from "@coral-xyz/anchor";
import { getOrCreateClient } from "../client-factory";

export const closePositionAction = {
  name: "SHIELD_CLOSE_POSITION",
  description:
    "Close an existing perpetual position on Flash Trade through the AgentShield vault.",
  similes: [
    "close my position",
    "close the long",
    "close the short",
    "exit position through shield",
    "close leveraged trade",
  ],

  validate: async (runtime: any, message: any): Promise<boolean> => {
    try {
      getOrCreateClient(runtime);
    } catch {
      return false;
    }

    const text = (message.content?.text || "").toLowerCase();
    const keywords = ["close position", "close long", "close short", "exit position"];
    return keywords.some((kw) => text.includes(kw));
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

      if (!params.targetSymbol || !params.collateralSymbol || !params.collateralAmount || !params.side) {
        callback({
          text: "Missing required fields: targetSymbol, collateralSymbol, collateralAmount, and side are required.",
          error: true,
        });
        return;
      }

      const sideObj = params.side === "long" ? { long: {} } : { short: {} };

      const result = await client.flashTradeClose({
        owner: vaultOwner,
        vaultId,
        agent: agentKey,
        targetSymbol: params.targetSymbol,
        collateralSymbol: params.collateralSymbol,
        collateralAmount: new BN(params.collateralAmount),
        side: sideObj as any,
        priceWithSlippage: {
          price: new BN(params.price || "0"),
          exponent: params.priceExponent || -8,
        },
      });

      const txSig = await client.executeFlashTrade(result, agentKey);

      callback({
        text: `Position closed through AgentShield vault.\nSide: ${params.side}\nTarget: ${params.targetSymbol}\nTransaction: ${txSig}`,
        data: { txSig },
      });
    } catch (error: any) {
      callback({
        text: `Close position failed: ${error.message}`,
        error: true,
      });
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Close my long SOL position",
          targetSymbol: "SOL",
          collateralSymbol: "USDC",
          collateralAmount: "100000000",
          side: "long",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Position closed through AgentShield vault.\nSide: long\nTarget: SOL\nTransaction: 7dEf...",
        },
      },
    ],
  ],
};

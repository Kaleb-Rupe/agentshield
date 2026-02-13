import { BN } from "@coral-xyz/anchor";
import { getOrCreateClient } from "../client-factory";

export const openPositionAction = {
  name: "SHIELD_OPEN_POSITION",
  description:
    "Open a leveraged perpetual position on Flash Trade through the AgentShield vault. " +
    "Enforces leverage limits, position count caps, and spending policy.",
  similes: [
    "open a long position",
    "open a short position",
    "go long through shield",
    "go short through shield",
    "open leveraged trade",
  ],

  validate: async (runtime: any, message: any): Promise<boolean> => {
    try {
      getOrCreateClient(runtime);
    } catch {
      return false;
    }

    const text = (message.content?.text || "").toLowerCase();
    const keywords = ["open position", "go long", "go short", "open long", "open short", "leverage"];
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

      if (!params.targetSymbol || !params.collateralSymbol || !params.collateralAmount || !params.sizeAmount || !params.side) {
        callback({
          text: "Missing required fields: targetSymbol, collateralSymbol, collateralAmount, sizeAmount, and side are required.",
          error: true,
        });
        return;
      }

      const sideObj = params.side === "long" ? { long: {} } : { short: {} };

      const result = await client.flashTradeOpen({
        owner: vaultOwner,
        vaultId,
        agent: agentKey,
        targetSymbol: params.targetSymbol,
        collateralSymbol: params.collateralSymbol,
        collateralAmount: new BN(params.collateralAmount),
        sizeAmount: new BN(params.sizeAmount),
        side: sideObj as any,
        priceWithSlippage: {
          price: new BN(params.price || "0"),
          exponent: params.priceExponent || -8,
        },
        leverageBps: params.leverageBps || 10000,
      });

      const txSig = await client.executeFlashTrade(result, agentKey);

      callback({
        text: `Position opened through AgentShield vault.\nSide: ${params.side}\nTarget: ${params.targetSymbol}\nLeverage: ${((params.leverageBps || 10000) / 10000).toFixed(1)}x\nTransaction: ${txSig}`,
        data: { txSig },
      });
    } catch (error: any) {
      callback({
        text: `Open position failed: ${error.message}`,
        error: true,
      });
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Open a 2x long SOL position with 100 USDC collateral",
          targetSymbol: "SOL",
          collateralSymbol: "USDC",
          collateralAmount: "100000000",
          sizeAmount: "200000000",
          side: "long",
          leverageBps: 20000,
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Position opened through AgentShield vault.\nSide: long\nTarget: SOL\nLeverage: 2.0x\nTransaction: 4aBc...",
        },
      },
    ],
  ],
};

import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getOrCreateClient } from "../client-factory";
import { AgentShieldPluginConfig } from "../types";

export const closePositionSchema = z.object({
  targetSymbol: z.string().describe("Target market symbol (e.g., 'SOL', 'BTC', 'ETH')"),
  collateralSymbol: z.string().describe("Collateral token symbol (e.g., 'USDC')"),
  collateralAmount: z.string().describe("Collateral amount in base units"),
  side: z.enum(["long", "short"]).describe("Trade direction of the position to close"),
  price: z.string().describe("Current oracle price as integer"),
  priceExponent: z.number().describe("Price exponent (e.g., -8 for 8 decimal places)"),
});

export type ClosePositionInput = z.infer<typeof closePositionSchema>;

export async function closePosition(
  agent: any,
  config: AgentShieldPluginConfig,
  input: ClosePositionInput
): Promise<string> {
  const client = getOrCreateClient(agent, config);

  const sideObj = input.side === "long" ? { long: {} } : { short: {} };

  const result = await client.flashTradeClose({
    owner: config.vaultOwner,
    vaultId: config.vaultId,
    agent: agent.wallet.publicKey,
    targetSymbol: input.targetSymbol,
    collateralSymbol: input.collateralSymbol,
    collateralAmount: new BN(input.collateralAmount),
    side: sideObj as any,
    priceWithSlippage: {
      price: new BN(input.price),
      exponent: input.priceExponent,
    },
  });

  const txSig = await client.executeFlashTrade(
    result,
    agent.wallet.publicKey
  );

  return `Position closed successfully.\nSide: ${input.side}\nTarget: ${input.targetSymbol}\nTransaction: ${txSig}`;
}

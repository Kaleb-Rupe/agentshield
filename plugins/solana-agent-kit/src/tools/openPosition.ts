import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getOrCreateClient } from "../client-factory";
import { AgentShieldPluginConfig } from "../types";

export const openPositionSchema = z.object({
  targetSymbol: z.string().describe("Target market symbol (e.g., 'SOL', 'BTC', 'ETH')"),
  collateralSymbol: z.string().describe("Collateral token symbol (e.g., 'USDC')"),
  collateralAmount: z.string().describe("Collateral amount in base units"),
  sizeAmount: z.string().describe("Position size in base units"),
  side: z.enum(["long", "short"]).describe("Trade direction: 'long' or 'short'"),
  leverageBps: z
    .number()
    .describe("Leverage in basis points (e.g., 20000 = 2x, 50000 = 5x)"),
  price: z.string().describe("Current oracle price as integer"),
  priceExponent: z.number().describe("Price exponent (e.g., -8 for 8 decimal places)"),
});

export type OpenPositionInput = z.infer<typeof openPositionSchema>;

export async function openPosition(
  agent: any,
  config: AgentShieldPluginConfig,
  input: OpenPositionInput
): Promise<string> {
  const client = getOrCreateClient(agent, config);

  const sideObj = input.side === "long" ? { long: {} } : { short: {} };

  const result = await client.flashTradeOpen({
    owner: config.vaultOwner,
    vaultId: config.vaultId,
    agent: agent.wallet.publicKey,
    targetSymbol: input.targetSymbol,
    collateralSymbol: input.collateralSymbol,
    collateralAmount: new BN(input.collateralAmount),
    sizeAmount: new BN(input.sizeAmount),
    side: sideObj as any,
    priceWithSlippage: {
      price: new BN(input.price),
      exponent: input.priceExponent,
    },
    leverageBps: input.leverageBps,
  });

  const txSig = await client.executeFlashTrade(
    result,
    agent.wallet.publicKey
  );

  return `Position opened successfully.\nSide: ${input.side}\nTarget: ${input.targetSymbol}\nCollateral: ${input.collateralAmount} ${input.collateralSymbol}\nLeverage: ${(input.leverageBps / 10000).toFixed(1)}x\nTransaction: ${txSig}`;
}

/**
 * T2 Protocol Handler Stubs — Kit-native
 *
 * Drift, Flash Trade, Kamino, and Squads handlers.
 * These are T2 (SDK-wrapped) protocols — their compose() will use compat.ts
 * to bridge web3.js types from the protocol SDKs to Kit types.
 *
 * Currently stubs: compose() throws NOT_IMPLEMENTED.
 * Full implementation requires importing the protocol SDKs.
 */

import type { Address } from "@solana/kit";
import type {
  ProtocolHandler,
  ProtocolHandlerMetadata,
  ProtocolComposeResult,
  ProtocolContext,
} from "./protocol-handler.js";
import { ActionType } from "../generated/types/actionType.js";

// ─── Program IDs ────────────────────────────────────────────────────────────

const DRIFT_PROGRAM: Address = "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH" as Address;
const FLASH_TRADE_PROGRAM: Address = "FLASH6Lo6h3iasJKWDs2F8TkW2UKf3s15C8PMGuVfgBn" as Address;
const KAMINO_LEND_PROGRAM: Address = "KLend2g3cP87ber8CzRaqeECGwNvLFM9acPVcRkRHvM" as Address;
const SQUADS_V4_PROGRAM: Address = "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf" as Address;

// ─── Drift Handler ──────────────────────────────────────────────────────────

const DRIFT_METADATA: ProtocolHandlerMetadata = {
  protocolId: "drift",
  displayName: "Drift Protocol",
  programIds: [DRIFT_PROGRAM],
  supportedActions: new Map([
    ["deposit", { actionType: ActionType.Deposit, isSpending: true }],
    ["withdraw", { actionType: ActionType.Withdraw, isSpending: false }],
    ["placePerpOrder", { actionType: ActionType.OpenPosition, isSpending: true }],
    ["placeSpotOrder", { actionType: ActionType.Swap, isSpending: true }],
    ["cancelOrder", { actionType: ActionType.CancelLimitOrder, isSpending: false }],
  ]),
};

export class DriftHandler implements ProtocolHandler {
  readonly metadata = DRIFT_METADATA;

  async compose(
    _ctx: ProtocolContext,
    _action: string,
    _params: Record<string, unknown>,
  ): Promise<ProtocolComposeResult> {
    throw new Error(
      "DriftHandler.compose() not yet implemented — requires @drift-labs/sdk. " +
      "Use compat.ts bridge when wiring up.",
    );
  }

  summarize(action: string, params: Record<string, unknown>): string {
    switch (action) {
      case "deposit": return `Drift deposit ${params.amount} of ${params.mint}`;
      case "withdraw": return `Drift withdraw ${params.amount} of ${params.mint}`;
      case "placePerpOrder": return `Drift perp ${params.side} ${params.marketIndex}`;
      case "placeSpotOrder": return `Drift spot ${params.side} ${params.marketIndex}`;
      case "cancelOrder": return `Drift cancel order #${params.orderId}`;
      default: return `Drift: ${action}`;
    }
  }
}

// ─── Flash Trade Handler ────────────────────────────────────────────────────

const FLASH_TRADE_METADATA: ProtocolHandlerMetadata = {
  protocolId: "flash-trade",
  displayName: "Flash Trade",
  programIds: [FLASH_TRADE_PROGRAM],
  supportedActions: new Map([
    ["openPosition", { actionType: ActionType.OpenPosition, isSpending: true }],
    ["closePosition", { actionType: ActionType.ClosePosition, isSpending: false }],
    ["increasePosition", { actionType: ActionType.IncreasePosition, isSpending: true }],
    ["decreasePosition", { actionType: ActionType.DecreasePosition, isSpending: false }],
    ["addCollateral", { actionType: ActionType.AddCollateral, isSpending: true }],
    ["removeCollateral", { actionType: ActionType.RemoveCollateral, isSpending: false }],
    ["placeTriggerOrder", { actionType: ActionType.PlaceTriggerOrder, isSpending: false }],
    ["editTriggerOrder", { actionType: ActionType.EditTriggerOrder, isSpending: false }],
    ["cancelTriggerOrder", { actionType: ActionType.CancelTriggerOrder, isSpending: false }],
    ["placeLimitOrder", { actionType: ActionType.PlaceLimitOrder, isSpending: true }],
    ["editLimitOrder", { actionType: ActionType.EditLimitOrder, isSpending: false }],
    ["cancelLimitOrder", { actionType: ActionType.CancelLimitOrder, isSpending: false }],
    ["swapAndOpen", { actionType: ActionType.SwapAndOpenPosition, isSpending: true }],
    ["closeAndSwap", { actionType: ActionType.CloseAndSwapPosition, isSpending: false }],
  ]),
};

export class FlashTradeHandler implements ProtocolHandler {
  readonly metadata = FLASH_TRADE_METADATA;

  async compose(
    _ctx: ProtocolContext,
    _action: string,
    _params: Record<string, unknown>,
  ): Promise<ProtocolComposeResult> {
    throw new Error(
      "FlashTradeHandler.compose() not yet implemented — requires flash-sdk. " +
      "Use compat.ts bridge when wiring up.",
    );
  }

  summarize(action: string, params: Record<string, unknown>): string {
    const market = params.market ?? "unknown";
    const side = params.side ?? "";
    switch (action) {
      case "openPosition": return `Flash open ${side} ${market}`;
      case "closePosition": return `Flash close ${market}`;
      case "increasePosition": return `Flash increase ${side} ${market}`;
      case "decreasePosition": return `Flash decrease ${side} ${market}`;
      default: return `Flash Trade: ${action} ${market}`;
    }
  }
}

// ─── Kamino Handler ─────────────────────────────────────────────────────────

const KAMINO_METADATA: ProtocolHandlerMetadata = {
  protocolId: "kamino-lending",
  displayName: "Kamino Lending",
  programIds: [KAMINO_LEND_PROGRAM],
  supportedActions: new Map([
    ["deposit", { actionType: ActionType.Deposit, isSpending: true }],
    ["borrow", { actionType: ActionType.Withdraw, isSpending: false }],
    ["repay", { actionType: ActionType.Deposit, isSpending: true }],
    ["withdraw", { actionType: ActionType.Withdraw, isSpending: false }],
  ]),
};

export class KaminoHandler implements ProtocolHandler {
  readonly metadata = KAMINO_METADATA;

  async compose(
    _ctx: ProtocolContext,
    _action: string,
    _params: Record<string, unknown>,
  ): Promise<ProtocolComposeResult> {
    throw new Error(
      "KaminoHandler.compose() not yet implemented — requires @kamino-finance/klend-sdk. " +
      "Use compat.ts bridge when wiring up.",
    );
  }

  summarize(action: string, params: Record<string, unknown>): string {
    return `Kamino ${action} ${params.amount ?? ""} ${params.mint ?? ""}`.trim();
  }
}

// ─── Squads Handler ─────────────────────────────────────────────────────────

const SQUADS_METADATA: ProtocolHandlerMetadata = {
  protocolId: "squads",
  displayName: "Squads V4",
  programIds: [SQUADS_V4_PROGRAM],
  supportedActions: new Map([
    ["propose", { actionType: ActionType.Swap, isSpending: false }],
    ["approve", { actionType: ActionType.Swap, isSpending: false }],
    ["execute", { actionType: ActionType.Swap, isSpending: true }],
  ]),
};

export class SquadsHandler implements ProtocolHandler {
  readonly metadata = SQUADS_METADATA;

  async compose(
    _ctx: ProtocolContext,
    _action: string,
    _params: Record<string, unknown>,
  ): Promise<ProtocolComposeResult> {
    throw new Error(
      "SquadsHandler.compose() not yet implemented — requires @sqds/multisig. " +
      "Use compat.ts bridge when wiring up.",
    );
  }

  summarize(action: string, params: Record<string, unknown>): string {
    return `Squads ${action} ${params.multisig ?? ""}`.trim();
  }
}

// ─── Singleton instances ────────────────────────────────────────────────────

export const driftHandler = new DriftHandler();
export const flashTradeHandler = new FlashTradeHandler();
export const kaminoHandler = new KaminoHandler();
export const squadsHandler = new SquadsHandler();

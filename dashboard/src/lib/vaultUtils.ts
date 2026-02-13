import type {
  VaultStatus,
  ActionType,
  AgentVaultAccount,
} from "@agent-shield/sdk";
import { PublicKey } from "@solana/web3.js";

export function getVaultStatusLabel(
  status: VaultStatus
): "Active" | "Frozen" | "Closed" {
  if ("active" in status) return "Active";
  if ("frozen" in status) return "Frozen";
  return "Closed";
}

export function getVaultStatusVariant(
  status: VaultStatus
): "success" | "destructive" | "secondary" {
  if ("active" in status) return "success";
  if ("frozen" in status) return "destructive";
  return "secondary";
}

export function getActionTypeLabel(action: ActionType): string {
  if ("swap" in action) return "Swap";
  if ("openPosition" in action) return "Open Position";
  if ("closePosition" in action) return "Close Position";
  if ("increasePosition" in action) return "Increase Position";
  if ("decreasePosition" in action) return "Decrease Position";
  if ("deposit" in action) return "Deposit";
  if ("withdraw" in action) return "Withdraw";
  return "Unknown";
}

export function isVaultActive(status: VaultStatus): boolean {
  return "active" in status;
}

export function hasAgent(vault: AgentVaultAccount): boolean {
  return !vault.agent.equals(PublicKey.default);
}

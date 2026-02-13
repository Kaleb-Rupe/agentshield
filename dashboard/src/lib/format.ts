import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export function truncateAddress(
  address: string | PublicKey,
  chars = 4
): string {
  const str = address.toString();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function formatBN(
  value: BN,
  decimals: number = 9,
  displayDecimals: number = 4
): string {
  const str = value.toString().padStart(decimals + 1, "0");
  const whole = str.slice(0, str.length - decimals) || "0";
  const frac = str.slice(str.length - decimals, str.length - decimals + displayDecimals);
  const formatted = `${whole}.${frac}`;
  return parseFloat(formatted).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

export function formatLamports(lamports: BN): string {
  return formatBN(lamports, 9, 4);
}

export function formatTimestamp(ts: BN): string {
  const date = new Date(ts.toNumber() * 1000);
  return date.toLocaleString();
}

export function formatRelativeTime(ts: BN): string {
  const now = Date.now() / 1000;
  const diff = now - ts.toNumber();
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatFeeBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatFeeRate(rate: number): string {
  const bps = rate / 100; // 20 → 0.2, 50 → 0.5
  if (bps === 0) return "0 BPS";
  return `${bps % 1 === 0 ? bps.toFixed(0) : bps.toFixed(1)} BPS`;
}

export function formatLeverageBps(bps: number): string {
  return `${(bps / 100).toFixed(1)}x`;
}

export function isValidBase58(str: string): boolean {
  try {
    new PublicKey(str);
    return true;
  } catch {
    return false;
  }
}

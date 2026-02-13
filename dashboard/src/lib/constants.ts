import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "4ZeVCqnjUgUtFrHHPG7jELUxvJeoVGHhGNgPrhBPwrHL"
);

export const RPC_URLS = {
  devnet: process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL
    || "https://api.devnet.solana.com",
  "mainnet-beta": process.env.NEXT_PUBLIC_HELIUS_MAINNET_URL
    || "https://api.mainnet-beta.solana.com",
} as const;

export const SOLSCAN_URLS = {
  devnet: "https://solscan.io",
  "mainnet-beta": "https://solscan.io",
} as const;

export const VAULT_REFRESH_INTERVAL = 30_000; // 30 seconds

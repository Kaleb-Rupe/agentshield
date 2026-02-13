"use client";

import React from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useNetwork } from "@/hooks/useNetwork";

import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { rpcUrl } = useNetwork();

  return (
    <ConnectionProvider
      endpoint={rpcUrl}
      config={{ commitment: "confirmed" }}
    >
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

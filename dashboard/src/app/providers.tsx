"use client";

import React from "react";
import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { SolanaProvider } from "@/components/providers/SolanaProvider";
import { AnchorProvider } from "@/components/providers/AnchorProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <SolanaProvider>
        <AnchorProvider>{children}</AnchorProvider>
      </SolanaProvider>
    </NetworkProvider>
  );
}

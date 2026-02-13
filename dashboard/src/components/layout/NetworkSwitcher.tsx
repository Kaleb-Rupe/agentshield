"use client";

import React from "react";
import { useNetwork } from "@/hooks/useNetwork";
import type { Network } from "@/components/providers/NetworkProvider";

export function NetworkSwitcher() {
  const { network, setNetwork } = useNetwork();

  return (
    <button
      onClick={() =>
        setNetwork(
          network === "devnet" ? "mainnet-beta" : "devnet"
        )
      }
      className="flex items-center gap-2 h-8 px-3 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-muted-foreground hover:border-white/[0.15] transition-all duration-200"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          network === "mainnet-beta"
            ? "bg-primary shadow-[0_0_6px_rgba(0,102,255,0.5)]"
            : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
        }`}
      />
      {network === "mainnet-beta" ? "Mainnet" : "Devnet"}
    </button>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Shield } from "lucide-react";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { GlobalSearch } from "@/components/search/GlobalSearch";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.05] bg-background/60 backdrop-blur-2xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 blue-glow-sm">
              <Shield className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="hidden sm:inline">AgentShield</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/explore"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Explore
            </Link>
            <Link
              href="/my-vaults"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              My Vaults
            </Link>
            <Link
              href="/create"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Create
            </Link>
          </nav>
        </div>
        <div className="hidden lg:block flex-1 max-w-sm">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-3">
          <NetworkSwitcher />
          <WalletMultiButtonDynamic className="!bg-white/[0.05] !border !border-white/[0.1] hover:!border-primary/30 hover:!shadow-[0_0_15px_rgba(0,102,255,0.1)] !h-9 !rounded-lg !text-sm !font-medium !transition-all !duration-200" />
        </div>
      </div>
    </header>
  );
}

import React from "react";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-primary/60" />
          <span>Secured by AgentShield</span>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Built on Solana. All data is on-chain.
        </p>
      </div>
    </footer>
  );
}

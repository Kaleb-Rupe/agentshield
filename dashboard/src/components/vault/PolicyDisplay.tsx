"use client";

import React from "react";
import type { PolicyConfigAccount } from "@agent-shield/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import {
  formatBN,
  formatFeeRate,
  formatLeverageBps,
} from "@/lib/format";
import { Settings } from "lucide-react";

export function PolicyDisplay({
  policy,
}: {
  policy: PolicyConfigAccount;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          Policy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Daily Cap</p>
            <p className="font-mono text-primary">
              {formatBN(policy.dailySpendingCap, 9, 4)} SOL
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Max Tx Size</p>
            <p className="font-mono text-primary">
              {formatBN(policy.maxTransactionSize, 9, 4)} SOL
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Max Leverage</p>
            <p className="font-mono">
              {formatLeverageBps(policy.maxLeverageBps)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Protocol Fee</p>
            <p className="font-mono">0.2 BPS (fixed)</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Developer Fee</p>
            <p className="font-mono">
              {formatFeeRate(policy.developerFeeRate)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Positions</p>
            <p>
              {policy.canOpenPositions ? "Allowed" : "Disabled"} (max{" "}
              {policy.maxConcurrentPositions})
            </p>
          </div>
        </div>

        {policy.allowedTokens.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Allowed Tokens
            </p>
            <div className="space-y-1">
              {policy.allowedTokens.map((t) => (
                <AddressDisplay
                  key={t.toBase58()}
                  address={t}
                  showDomain={false}
                />
              ))}
            </div>
          </div>
        )}

        {policy.allowedProtocols.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Allowed Protocols
            </p>
            <div className="space-y-1">
              {policy.allowedProtocols.map((p) => (
                <AddressDisplay
                  key={p.toBase58()}
                  address={p}
                  showDomain={false}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

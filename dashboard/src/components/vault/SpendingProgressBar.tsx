"use client";

import React from "react";
import { BN } from "@coral-xyz/anchor";
import type {
  PolicyConfigAccount,
  SpendTrackerAccount,
} from "@agent-shield/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBN } from "@/lib/format";
import { TrendingUp } from "lucide-react";

export function SpendingProgressBar({
  policy,
  tracker,
}: {
  policy: PolicyConfigAccount;
  tracker: SpendTrackerAccount | null;
}) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 86400;

  let totalSpent = new BN(0);
  if (tracker) {
    for (const entry of tracker.rollingSpends) {
      if (entry.timestamp.toNumber() >= windowStart) {
        totalSpent = totalSpent.add(entry.amountSpent);
      }
    }
  }

  const cap = policy.dailySpendingCap;
  const pct = cap.isZero()
    ? 0
    : Math.min(
        100,
        totalSpent.mul(new BN(100)).div(cap).toNumber()
      );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          24h Spending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2.5" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="text-primary font-mono">{formatBN(totalSpent, 9, 4)}</span> spent
          </span>
          <span className="text-muted-foreground">
            <span className="font-mono">{formatBN(cap, 9, 4)}</span> cap
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {pct.toFixed(1)}% of daily limit used
        </p>
      </CardContent>
    </Card>
  );
}

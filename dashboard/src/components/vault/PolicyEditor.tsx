"use client";

import React, { useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { PolicyConfigAccount } from "@agent-shield/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAgentShieldClient } from "@/hooks/useAgentShieldClient";
import { Settings, Save } from "lucide-react";

export function PolicyEditor({
  vaultAddress,
  policy,
  onUpdated,
}: {
  vaultAddress: string;
  policy: PolicyConfigAccount;
  onUpdated?: () => void;
}) {
  const { client } = useAgentShieldClient();
  const [dailyCap, setDailyCap] = useState(
    (policy.dailySpendingCap.toNumber() / 1e9).toString()
  );
  const [maxTxSize, setMaxTxSize] = useState(
    (policy.maxTransactionSize.toNumber() / 1e9).toString()
  );
  const [maxLeverage, setMaxLeverage] = useState(
    (policy.maxLeverageBps / 100).toString()
  );
  const [developerFeeBps, setDeveloperFeeBps] = useState(
    (policy.developerFeeRate / 100).toString()
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!client) return;
    setSubmitting(true);
    try {
      await client.updatePolicy(new PublicKey(vaultAddress), {
        dailySpendingCap: new BN(
          Math.floor(parseFloat(dailyCap) * 1e9)
        ),
        maxTransactionSize: new BN(
          Math.floor(parseFloat(maxTxSize) * 1e9)
        ),
        maxLeverageBps: Math.floor(parseFloat(maxLeverage) * 100),
        developerFeeRate: Math.floor(parseFloat(developerFeeBps) * 100),
      });
      onUpdated?.();
    } catch (e: any) {
      console.error("Update policy failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          Edit Policy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div>
            <Label>Daily Spending Cap (SOL)</Label>
            <Input
              type="number"
              value={dailyCap}
              onChange={(e) => setDailyCap(e.target.value)}
              step="0.1"
            />
          </div>
          <div>
            <Label>Max Transaction Size (SOL)</Label>
            <Input
              type="number"
              value={maxTxSize}
              onChange={(e) => setMaxTxSize(e.target.value)}
              step="0.1"
            />
          </div>
          <div>
            <Label>Max Leverage (x)</Label>
            <Input
              type="number"
              value={maxLeverage}
              onChange={(e) => setMaxLeverage(e.target.value)}
              step="0.1"
            />
          </div>
          <div>
            <Label>Developer Fee (BPS, max 0.5)</Label>
            <Input
              type="number"
              value={developerFeeBps}
              onChange={(e) => setDeveloperFeeBps(e.target.value)}
              step="0.1"
              min="0"
              max="0.5"
            />
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !client}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {submitting ? "Updating..." : "Update Policy"}
        </Button>
      </CardContent>
    </Card>
  );
}

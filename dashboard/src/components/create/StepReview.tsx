"use client";

import React from "react";
import type { BasicInfoData } from "./StepBasicInfo";
import type { PolicyData } from "./StepPolicy";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/format";

export function StepReview({
  basicInfo,
  policyData,
  onBack,
  onSubmit,
  submitting,
}: {
  basicInfo: BasicInfoData;
  policyData: PolicyData;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const tokens = policyData.allowedTokens
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const protocols = policyData.allowedProtocols
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Review & Create</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Confirm your vault settings before submitting.
        </p>
      </div>

      <div className="rounded-xl bg-card/80 backdrop-blur-xl border border-white/[0.06] p-5 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Vault ID</p>
            <p className="font-mono">{basicInfo.vaultId}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fee Destination</p>
            <p className="font-mono">
              {truncateAddress(basicInfo.feeDestination, 6)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Daily Cap</p>
            <p className="font-mono text-primary">
              {policyData.dailySpendingCap || "0"} SOL
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Max Tx Size</p>
            <p className="font-mono text-primary">
              {policyData.maxTransactionSize || "0"} SOL
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Max Leverage</p>
            <p className="font-mono">
              {policyData.maxLeverageBps || "0"}x
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Max Positions</p>
            <p className="font-mono">
              {policyData.maxConcurrentPositions || "0"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Protocol Fee</p>
            <p className="font-mono">0.2 BPS (fixed)</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Developer Fee</p>
            <p className="font-mono">
              {policyData.developerFeeRate || "0"} BPS
            </p>
          </div>
        </div>
        {tokens.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Allowed Tokens</p>
            <p className="font-mono text-xs">{tokens.join(", ")}</p>
          </div>
        )}
        {protocols.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Allowed Protocols</p>
            <p className="font-mono text-xs">
              {protocols.join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          className="flex-1"
          disabled={submitting}
        >
          {submitting ? "Creating Vault..." : "Create Vault"}
        </Button>
      </div>
    </div>
  );
}

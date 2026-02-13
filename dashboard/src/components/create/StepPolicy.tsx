"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface PolicyData {
  dailySpendingCap: string;
  maxTransactionSize: string;
  maxLeverageBps: string;
  maxConcurrentPositions: string;
  allowedTokens: string;
  allowedProtocols: string;
  developerFeeRate: string;
}

export function StepPolicy({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: PolicyData;
  onChange: (d: PolicyData) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Policy Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set spending limits, leverage caps, and whitelists.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Daily Spending Cap (SOL)</Label>
          <Input
            type="number"
            placeholder="10"
            value={data.dailySpendingCap}
            onChange={(e) =>
              onChange({
                ...data,
                dailySpendingCap: e.target.value,
              })
            }
            step="0.1"
          />
        </div>
        <div>
          <Label>Max Transaction Size (SOL)</Label>
          <Input
            type="number"
            placeholder="1"
            value={data.maxTransactionSize}
            onChange={(e) =>
              onChange({
                ...data,
                maxTransactionSize: e.target.value,
              })
            }
            step="0.1"
          />
        </div>
        <div>
          <Label>Max Leverage (x)</Label>
          <Input
            type="number"
            placeholder="5"
            value={data.maxLeverageBps}
            onChange={(e) =>
              onChange({
                ...data,
                maxLeverageBps: e.target.value,
              })
            }
            step="0.1"
          />
        </div>
        <div>
          <Label>Max Concurrent Positions</Label>
          <Input
            type="number"
            placeholder="3"
            value={data.maxConcurrentPositions}
            onChange={(e) =>
              onChange({
                ...data,
                maxConcurrentPositions: e.target.value,
              })
            }
          />
        </div>
        <div>
          <Label>Developer Fee (BPS, 0-0.5)</Label>
          <Input
            type="number"
            placeholder="0"
            value={data.developerFeeRate}
            onChange={(e) =>
              onChange({
                ...data,
                developerFeeRate: e.target.value,
              })
            }
            step="0.1"
            min="0"
            max="0.5"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Protocol fee of 0.2 BPS is always applied. Max developer fee: 0.5 BPS.
          </p>
        </div>
      </div>

      <div>
        <Label>Allowed Token Mints (comma-separated)</Label>
        <Input
          placeholder="Pubkey1, Pubkey2..."
          value={data.allowedTokens}
          onChange={(e) =>
            onChange({ ...data, allowedTokens: e.target.value })
          }
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Leave empty to allow all tokens. Max 10.
        </p>
      </div>

      <div>
        <Label>Allowed Protocol Programs (comma-separated)</Label>
        <Input
          placeholder="Pubkey1, Pubkey2..."
          value={data.allowedProtocols}
          onChange={(e) =>
            onChange({ ...data, allowedProtocols: e.target.value })
          }
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Leave empty to allow all protocols. Max 10.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Next: Review
        </Button>
      </div>
    </div>
  );
}

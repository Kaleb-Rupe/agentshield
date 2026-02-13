"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface BasicInfoData {
  vaultId: string;
  feeDestination: string;
}

export function StepBasicInfo({
  data,
  onChange,
  onNext,
}: {
  data: BasicInfoData;
  onChange: (d: BasicInfoData) => void;
  onNext: () => void;
}) {
  const valid = data.vaultId.trim() !== "" && data.feeDestination.trim().length >= 32;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Basic Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set a unique vault ID and the fee destination address.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Vault ID (numeric)</Label>
          <Input
            type="number"
            placeholder="1"
            value={data.vaultId}
            onChange={(e) =>
              onChange({ ...data, vaultId: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Unique per owner. Use a simple incrementing number.
          </p>
        </div>

        <div>
          <Label>Fee Destination (Pubkey)</Label>
          <Input
            placeholder="Enter a Solana address..."
            value={data.feeDestination}
            onChange={(e) =>
              onChange({ ...data, feeDestination: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Treasury wallet that receives protocol fees. Immutable
            after creation.
          </p>
        </div>
      </div>

      <Button onClick={onNext} disabled={!valid} className="w-full">
        Next: Policy Configuration
      </Button>
    </div>
  );
}

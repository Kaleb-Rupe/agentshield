"use client";

import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAgentShieldClient } from "@/hooks/useAgentShieldClient";
import { AlertTriangle } from "lucide-react";

export function KillSwitchButton({
  vaultAddress,
  onRevoked,
}: {
  vaultAddress: string;
  onRevoked?: () => void;
}) {
  const { client } = useAgentShieldClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRevoke = async () => {
    if (!client) return;
    setSubmitting(true);
    try {
      await client.revokeAgent(new PublicKey(vaultAddress));
      setOpen(false);
      onRevoked?.();
    } catch (e: any) {
      console.error("Kill switch failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full"
          disabled={!client}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Kill Switch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            Emergency Freeze
          </DialogTitle>
          <DialogDescription>
            This will immediately revoke the agent and freeze the
            vault. The agent will no longer be able to execute any
            transactions. You can reactivate the vault later.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "Freezing..." : "Confirm Freeze"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

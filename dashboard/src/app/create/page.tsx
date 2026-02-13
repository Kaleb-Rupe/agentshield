"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { CreateVaultWizard } from "@/components/create/CreateVaultWizard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Wallet } from "lucide-react";

export default function CreatePage() {
  const { publicKey } = useWallet();

  return (
    <div className="container py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create Vault</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new AgentShield vault with custom policies.
        </p>
      </div>

      {!publicKey ? (
        <EmptyState
          icon={Wallet}
          title="Connect your wallet"
          description="You need to connect a wallet to create a vault."
        />
      ) : (
        <CreateVaultWizard />
      )}
    </div>
  );
}

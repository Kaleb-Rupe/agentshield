"use client";

import React from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMyVaults } from "@/hooks/useMyVaults";
import { VaultCard } from "@/components/vault/VaultCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, Shield } from "lucide-react";

export default function MyVaultsPage() {
  const { publicKey } = useWallet();
  const { vaults, loading } = useMyVaults();

  if (!publicKey) {
    return (
      <div className="container py-8">
        <EmptyState
          icon={Wallet}
          title="Connect your wallet"
          description="Connect a wallet to see your vaults."
        />
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Vaults</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AgentShield vaults.
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Vault
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : vaults.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No vaults yet"
          description="Create your first vault to start managing AI agent permissions."
        >
          <Button asChild>
            <Link href="/create">Create Vault</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vaults.map((entry) => (
            <VaultCard
              key={entry.address.toBase58()}
              entry={entry}
            />
          ))}
        </div>
      )}
    </div>
  );
}

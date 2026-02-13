"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useVaultLive } from "@/hooks/useVaultLive";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { VaultStatusBadge } from "@/components/shared/VaultStatusBadge";
import { AgentInfo } from "@/components/vault/AgentInfo";
import { SpendingProgressBar } from "@/components/vault/SpendingProgressBar";
import { VaultBalances } from "@/components/vault/VaultBalances";
import { PolicyDisplay } from "@/components/vault/PolicyDisplay";
import { PolicyEditor } from "@/components/vault/PolicyEditor";
import { ActivityFeed } from "@/components/vault/ActivityFeed";
import { KillSwitchButton } from "@/components/vault/KillSwitchButton";
import { CodeSnippetsPanel } from "@/components/vault/CodeSnippetsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBN, formatTimestamp } from "@/lib/format";
import { isVaultActive, hasAgent } from "@/lib/vaultUtils";
import { AlertTriangle, Info } from "lucide-react";

export default function VaultDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const { publicKey } = useWallet();
  const { vault, policy, tracker, loading, error, refresh } =
    useVaultLive(address);

  const isOwner =
    vault && publicKey ? vault.owner.equals(publicKey) : false;

  if (loading && !vault) {
    return (
      <div className="container py-16 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !vault) {
    return (
      <div className="container py-8">
        <EmptyState
          icon={AlertTriangle}
          title="Vault not found"
          description={error || `No vault found at ${address}`}
        />
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Vault</h1>
            <VaultStatusBadge status={vault.status} />
          </div>
          <AddressDisplay address={address} />
        </div>
        <div className="flex items-center gap-3">
          {isOwner && isVaultActive(vault.status) && hasAgent(vault) && (
            <KillSwitchButton
              vaultAddress={address}
              onRevoked={refresh}
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Owner</p>
              <AddressDisplay
                address={vault.owner}
                showLink={false}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Created</p>
              <p>{formatTimestamp(vault.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Volume</p>
              <p className="font-mono text-primary">
                {formatBN(vault.totalVolume, 9, 4)} SOL
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Transactions</p>
              <p className="font-mono">
                {vault.totalTransactions.toString()}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Vault ID</p>
              <p className="font-mono">{vault.vaultId.toString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Open Positions</p>
              <p>{vault.openPositions}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fees Collected</p>
              <p className="font-mono text-primary">
                {formatBN(vault.totalFeesCollected, 9, 4)} SOL
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fee Destination</p>
              <AddressDisplay
                address={vault.feeDestination}
                showLink={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AgentInfo vault={vault} />
          {policy && (
            <SpendingProgressBar policy={policy} tracker={tracker} />
          )}
          <VaultBalances vaultAddress={address} />
        </div>
        <div className="space-y-6">
          {policy &&
            (isOwner ? (
              <PolicyEditor
                vaultAddress={address}
                policy={policy}
                onUpdated={refresh}
              />
            ) : (
              <PolicyDisplay policy={policy} />
            ))}
        </div>
      </div>

      {/* Activity */}
      <ActivityFeed tracker={tracker} />

      {/* Code Snippets */}
      <CodeSnippetsPanel vaultAddress={address} />
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import type { VaultWithMeta } from "@/lib/programAccounts";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaderboardRow } from "./LeaderboardRow";
import {
  LeaderboardFilters,
  type StatusFilter,
  type SortField,
} from "./LeaderboardFilters";
import { getVaultStatusLabel } from "@/lib/vaultUtils";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart3 } from "lucide-react";

export function LeaderboardTable({
  vaults,
  loading,
  onRefresh,
}: {
  vaults: VaultWithMeta[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("volume");

  const filtered = useMemo(() => {
    let items = [...vaults];

    if (statusFilter !== "all") {
      items = items.filter((v) => {
        const label = getVaultStatusLabel(v.vault.status).toLowerCase();
        return label === statusFilter;
      });
    }

    items.sort((a, b) => {
      if (sortField === "volume") {
        return b.vault.totalVolume.cmp(a.vault.totalVolume);
      }
      return b.vault.totalTransactions.cmp(
        a.vault.totalTransactions
      );
    });

    return items;
  }, [vaults, statusFilter, sortField]);

  return (
    <div className="space-y-4">
      <LeaderboardFilters
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortField={sortField}
        onSortChange={setSortField}
        onRefresh={onRefresh}
        loading={loading}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No vaults found"
          description={
            statusFilter !== "all"
              ? "Try changing the status filter."
              : "No vaults exist on this network yet."
          }
        />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Vault</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Volume (SOL)</TableHead>
                <TableHead className="text-right">Txs</TableHead>
                <TableHead className="text-center">Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry, i) => (
                <LeaderboardRow
                  key={entry.address.toBase58()}
                  entry={entry}
                  rank={i + 1}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

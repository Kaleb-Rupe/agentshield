"use client";

import React from "react";
import Link from "next/link";
import type { VaultWithMeta } from "@/lib/programAccounts";
import { TableRow, TableCell } from "@/components/ui/table";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { VaultStatusBadge } from "@/components/shared/VaultStatusBadge";
import { formatBN } from "@/lib/format";
import { hasAgent } from "@/lib/vaultUtils";

export function LeaderboardRow({
  entry,
  rank,
}: {
  entry: VaultWithMeta;
  rank: number;
}) {
  const { vault, address } = entry;

  return (
    <TableRow>
      <TableCell className={`font-mono font-medium ${rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
        {rank}
      </TableCell>
      <TableCell>
        <Link
          href={`/vault/${address.toBase58()}`}
          className="text-foreground hover:text-primary transition-colors"
        >
          <AddressDisplay
            address={address}
            showCopy={false}
            showLink={false}
          />
        </Link>
      </TableCell>
      <TableCell>
        <AddressDisplay
          address={vault.owner}
          showCopy={false}
          showLink={false}
        />
      </TableCell>
      <TableCell>
        <VaultStatusBadge status={vault.status} />
      </TableCell>
      <TableCell className="font-mono text-right text-primary">
        {formatBN(vault.totalVolume, 9, 2)}
      </TableCell>
      <TableCell className="font-mono text-right">
        {vault.totalTransactions.toString()}
      </TableCell>
      <TableCell className="text-center">
        {hasAgent(vault) ? (
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
        ) : (
          <span className="inline-flex h-2 w-2 rounded-full bg-white/10" />
        )}
      </TableCell>
    </TableRow>
  );
}

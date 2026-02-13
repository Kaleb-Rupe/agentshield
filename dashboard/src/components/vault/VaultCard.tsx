"use client";

import React from "react";
import Link from "next/link";
import type { VaultWithMeta } from "@/lib/programAccounts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { VaultStatusBadge } from "@/components/shared/VaultStatusBadge";
import { formatBN } from "@/lib/format";
import { hasAgent } from "@/lib/vaultUtils";
import { ArrowRight, Bot } from "lucide-react";

export function VaultCard({ entry }: { entry: VaultWithMeta }) {
  const { vault, address } = entry;

  return (
    <Card className="flex flex-col group hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Vault #{vault.vaultId.toString()}
          </CardTitle>
          <VaultStatusBadge status={vault.status} />
        </div>
        <AddressDisplay
          address={address}
          showDomain={false}
          showLink={false}
        />
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Volume</p>
            <p className="font-mono text-foreground">
              {formatBN(vault.totalVolume, 9, 2)} SOL
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Transactions</p>
            <p className="font-mono text-foreground">
              {vault.totalTransactions.toString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {hasAgent(vault) ? (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                Agent active
              </span>
            ) : (
              "No agent"
            )}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full" size="sm">
          <Link href={`/vault/${address.toBase58()}`}>
            View Details
            <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

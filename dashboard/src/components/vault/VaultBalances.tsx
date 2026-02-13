"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Wallet } from "lucide-react";

export function VaultBalances({
  vaultAddress,
}: {
  vaultAddress: string;
}) {
  const { balances, solBalance, loading } =
    useTokenBalances(vaultAddress);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">SOL</span>
              <span className="text-sm font-mono">
                {solBalance.toFixed(4)}
              </span>
            </div>
            {balances.map((b) => (
              <div
                key={b.mint.toBase58()}
                className="flex justify-between items-center"
              >
                <AddressDisplay
                  address={b.mint}
                  showLink={false}
                  showDomain={false}
                />
                <span className="text-sm font-mono">
                  {b.amount.uiAmountString || "0"}
                </span>
              </div>
            ))}
            {balances.length === 0 && solBalance === 0 && (
              <p className="text-sm text-muted-foreground">
                No balances
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

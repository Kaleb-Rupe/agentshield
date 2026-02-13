"use client";

import React from "react";
import type { SpendTrackerAccount } from "@agent-shield/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { getActionTypeLabel } from "@/lib/vaultUtils";
import { formatBN, formatRelativeTime } from "@/lib/format";
import { Activity } from "lucide-react";

export function ActivityFeed({
  tracker,
}: {
  tracker: SpendTrackerAccount | null;
}) {
  const records = tracker?.recentTransactions ?? [];
  const sorted = [...records].sort(
    (a, b) => b.timestamp.toNumber() - a.timestamp.toNumber()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Activity ({sorted.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No transactions recorded yet.
          </p>
        ) : (
          <div className="rounded-lg border border-white/[0.06] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((tx, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(tx.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getActionTypeLabel(tx.actionType)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary">
                      {formatBN(tx.amount, 9, 4)}
                    </TableCell>
                    <TableCell>
                      <AddressDisplay
                        address={tx.protocol}
                        showCopy={false}
                        showDomain={false}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.success ? "success" : "destructive"
                        }
                      >
                        {tx.success ? "OK" : "Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import React from "react";
import type { AgentVaultAccount } from "@agent-shield/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { Badge } from "@/components/ui/badge";
import { hasAgent } from "@/lib/vaultUtils";
import { Bot } from "lucide-react";

export function AgentInfo({ vault }: { vault: AgentVaultAccount }) {
  const agentRegistered = hasAgent(vault);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Agent
        </CardTitle>
      </CardHeader>
      <CardContent>
        {agentRegistered ? (
          <div className="space-y-3">
            <div className="font-mono text-sm">
              <AddressDisplay address={vault.agent} />
            </div>
            <Badge variant="success">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Registered
              </span>
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No agent registered
          </p>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import React from "react";
import { useAllVaults } from "@/hooks/useAllVaults";
import { LeaderboardTable } from "@/components/explore/LeaderboardTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function ExplorePage() {
  const { vaults, loading, refresh } = useAllVaults();

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explore Vaults</h1>
        <p className="text-muted-foreground mt-1">
          All AgentShield vaults ranked by volume and activity.
        </p>
      </div>

      {loading && vaults.length === 0 ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <LeaderboardTable
          vaults={vaults}
          loading={loading}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}

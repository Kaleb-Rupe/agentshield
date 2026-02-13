"use client";

import React from "react";
import Link from "next/link";
import type { SearchResultType } from "@/hooks/useSearch";
import { truncateAddress } from "@/lib/format";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Vault, User, AlertCircle } from "lucide-react";

export function SearchResults({
  result,
  loading,
  onSelect,
}: {
  result: SearchResultType;
  loading: boolean;
  onSelect?: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-muted-foreground">
          Searching...
        </span>
      </div>
    );
  }

  if (result.kind === "idle") return null;

  if (result.kind === "invalid") {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        Invalid address or .sol domain
      </div>
    );
  }

  if (result.kind === "not-found") {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        No vaults found
      </div>
    );
  }

  if (result.kind === "vault") {
    return (
      <Link
        href={`/vault/${result.address.toBase58()}`}
        onClick={onSelect}
        className="flex items-center gap-3 p-3 hover:bg-accent rounded-md transition-colors"
      >
        <Vault className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-medium">Vault</p>
          <p className="text-xs text-muted-foreground font-mono">
            {truncateAddress(result.address.toBase58(), 8)}
          </p>
        </div>
      </Link>
    );
  }

  if (result.kind === "owner") {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Owner: {truncateAddress(result.address.toBase58(), 6)} —{" "}
            {result.vaults.length} vault(s)
          </span>
        </div>
        {result.vaults.map((v) => (
          <Link
            key={v.address.toBase58()}
            href={`/vault/${v.address.toBase58()}`}
            onClick={onSelect}
            className="flex items-center gap-3 p-3 hover:bg-accent rounded-md transition-colors"
          >
            <Vault className="h-4 w-4 text-primary" />
            <p className="text-sm font-mono">
              {truncateAddress(v.address.toBase58(), 8)}
            </p>
          </Link>
        ))}
      </div>
    );
  }

  return null;
}

"use client";

import { useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAgentShieldClient } from "./useAgentShieldClient";
import { resolveSolDomain } from "@/lib/sns";
import { isValidBase58 } from "@/lib/format";
import { fetchVaultsByOwner } from "@/lib/programAccounts";
import type { VaultWithMeta } from "@/lib/programAccounts";

export type SearchResultType =
  | { kind: "vault"; address: PublicKey }
  | { kind: "owner"; address: PublicKey; vaults: VaultWithMeta[] }
  | { kind: "not-found" }
  | { kind: "invalid" }
  | { kind: "idle" };

export function useSearch() {
  const { connection } = useConnection();
  const { program } = useAgentShieldClient();
  const [result, setResult] = useState<SearchResultType>({
    kind: "idle",
  });
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (!program) return;
      const trimmed = query.trim();
      if (!trimmed) {
        setResult({ kind: "idle" });
        return;
      }

      setLoading(true);
      try {
        let address: PublicKey | null = null;

        // Try .sol domain resolution
        if (trimmed.endsWith(".sol")) {
          address = await resolveSolDomain(connection, trimmed);
          if (!address) {
            setResult({ kind: "not-found" });
            return;
          }
        } else if (isValidBase58(trimmed)) {
          address = new PublicKey(trimmed);
        } else {
          setResult({ kind: "invalid" });
          return;
        }

        // Try fetching as vault
        try {
          await program.account.agentVault.fetch(address);
          setResult({ kind: "vault", address });
          return;
        } catch {}

        // Try as owner
        const ownerVaults = await fetchVaultsByOwner(
          program,
          address
        );
        if (ownerVaults.length > 0) {
          setResult({
            kind: "owner",
            address,
            vaults: ownerVaults,
          });
          return;
        }

        setResult({ kind: "not-found" });
      } catch {
        setResult({ kind: "not-found" });
      } finally {
        setLoading(false);
      }
    },
    [connection, program]
  );

  const reset = useCallback(() => {
    setResult({ kind: "idle" });
  }, []);

  return { search, result, loading, reset };
}

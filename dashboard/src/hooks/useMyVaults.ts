"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAgentShieldClient } from "./useAgentShieldClient";
import {
  fetchVaultsByOwner,
  type VaultWithMeta,
} from "@/lib/programAccounts";

export function useMyVaults() {
  const { publicKey } = useWallet();
  const { program } = useAgentShieldClient();
  const [vaults, setVaults] = useState<VaultWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!program || !publicKey) {
      setVaults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchVaultsByOwner(program, publicKey);
      setVaults(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch vaults");
    } finally {
      setLoading(false);
    }
  }, [program, publicKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { vaults, loading, error, refresh: fetch };
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAgentShieldClient } from "./useAgentShieldClient";
import {
  fetchAllVaults,
  type VaultWithMeta,
} from "@/lib/programAccounts";
import { VAULT_REFRESH_INTERVAL } from "@/lib/constants";

export function useAllVaults() {
  const { program } = useAgentShieldClient();
  const [vaults, setVaults] = useState<VaultWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const fetch = useCallback(async () => {
    if (!program) return;
    try {
      const data = await fetchAllVaults(program);
      setVaults(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch vaults");
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetch();
    intervalRef.current = setInterval(fetch, VAULT_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  return { vaults, loading, error, refresh: fetch };
}

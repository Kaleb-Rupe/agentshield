"use client";

import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { resolveSolDomain } from "@/lib/sns";

export function useSnsResolve() {
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);

  const resolve = useCallback(
    async (domain: string): Promise<PublicKey | null> => {
      setLoading(true);
      try {
        return await resolveSolDomain(connection, domain);
      } finally {
        setLoading(false);
      }
    },
    [connection]
  );

  return { resolve, loading };
}

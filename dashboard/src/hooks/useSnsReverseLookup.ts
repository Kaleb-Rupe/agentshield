"use client";

import { useRef, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { reverseLookupAddress } from "@/lib/sns";

export function useSnsReverseLookup() {
  const { connection } = useConnection();
  const cache = useRef<Map<string, string | null>>(new Map());

  const lookup = useCallback(
    async (address: PublicKey): Promise<string | null> => {
      const key = address.toBase58();
      if (cache.current.has(key)) {
        return cache.current.get(key)!;
      }
      const result = await reverseLookupAddress(connection, address);
      cache.current.set(key, result);
      return result;
    },
    [connection]
  );

  return { lookup, cache: cache.current };
}

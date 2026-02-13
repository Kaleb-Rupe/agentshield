"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, type TokenAmount } from "@solana/web3.js";

export interface TokenBalance {
  mint: PublicKey;
  address: PublicKey;
  amount: TokenAmount;
}

export function useTokenBalances(vaultAddress: string | null) {
  const { connection } = useConnection();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number>(0);

  const fetch = useCallback(async () => {
    if (!vaultAddress) return;
    setLoading(true);
    try {
      const pk = new PublicKey(vaultAddress);

      const [tokenAccounts, lamports] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(pk, {
          programId: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
        }),
        connection.getBalance(pk),
      ]);

      setSolBalance(lamports / 1e9);

      setBalances(
        tokenAccounts.value.map((ta) => ({
          mint: new PublicKey(
            ta.account.data.parsed.info.mint
          ),
          address: ta.pubkey,
          amount: ta.account.data.parsed.info.tokenAmount,
        }))
      );
    } catch {
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, [connection, vaultAddress]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { balances, solBalance, loading, refresh: fetch };
}

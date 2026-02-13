"use client";

import { useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getPolicyPDA, getTrackerPDA } from "@agent-shield/sdk";
import { useVault, type VaultData } from "./useVault";
import { useAgentShieldClient } from "./useAgentShieldClient";

export function useVaultLive(address: string | null): VaultData {
  const data = useVault(address);
  const { connection } = useConnection();
  const { program } = useAgentShieldClient();

  useEffect(() => {
    if (!address || !program) return;

    const vaultPk = new PublicKey(address);
    const [trackerPda] = getTrackerPDA(vaultPk, program.programId);

    const ids: number[] = [];

    ids.push(
      connection.onAccountChange(vaultPk, () => {
        data.refresh();
      })
    );

    ids.push(
      connection.onAccountChange(trackerPda, () => {
        data.refresh();
      })
    );

    return () => {
      ids.forEach((id) => connection.removeAccountChangeListener(id));
    };
  }, [address, connection, program]);

  return data;
}

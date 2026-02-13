"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import type {
  AgentVaultAccount,
  PolicyConfigAccount,
  SpendTrackerAccount,
} from "@agent-shield/sdk";
import { getPolicyPDA, getTrackerPDA } from "@agent-shield/sdk";
import { useAgentShieldClient } from "./useAgentShieldClient";

export interface VaultData {
  vault: AgentVaultAccount | null;
  policy: PolicyConfigAccount | null;
  tracker: SpendTrackerAccount | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useVault(address: string | null): VaultData {
  const { program } = useAgentShieldClient();
  const [vault, setVault] = useState<AgentVaultAccount | null>(null);
  const [policy, setPolicy] = useState<PolicyConfigAccount | null>(null);
  const [tracker, setTracker] =
    useState<SpendTrackerAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!program || !address) return;
    setLoading(true);
    setError(null);
    try {
      const vaultPk = new PublicKey(address);
      const vaultData = (await program.account.agentVault.fetch(
        vaultPk
      )) as unknown as AgentVaultAccount;
      setVault(vaultData);

      const [policyPda] = getPolicyPDA(vaultPk, program.programId);
      const [trackerPda] = getTrackerPDA(vaultPk, program.programId);

      const [policyData, trackerData] = await Promise.all([
        program.account.policyConfig
          .fetch(policyPda)
          .catch(() => null),
        program.account.spendTracker
          .fetch(trackerPda)
          .catch(() => null),
      ]);

      setPolicy(policyData as unknown as PolicyConfigAccount | null);
      setTracker(
        trackerData as unknown as SpendTrackerAccount | null
      );
    } catch (e: any) {
      setError(e.message || "Failed to fetch vault");
      setVault(null);
      setPolicy(null);
      setTracker(null);
    } finally {
      setLoading(false);
    }
  }, [program, address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { vault, policy, tracker, loading, error, refresh: fetch };
}

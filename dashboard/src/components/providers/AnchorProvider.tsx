"use client";

import React, { createContext, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider as AnchorProviderLib, Program } from "@coral-xyz/anchor";
import {
  AgentShieldClient,
  IDL,
  AGENT_SHIELD_PROGRAM_ID,
} from "@agent-shield/sdk";
import type { AgentShield } from "@agent-shield/sdk";

export interface AnchorContextValue {
  program: Program<AgentShield> | null;
  client: AgentShieldClient | null;
}

export const AnchorContext = createContext<AnchorContextValue>({
  program: null,
  client: null,
});

export function AnchorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const value = useMemo<AnchorContextValue>(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      // Read-only: create a dummy provider for fetching
      const readOnlyProvider = new AnchorProviderLib(
        connection,
        {
          publicKey: null as any,
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any) => txs,
        },
        { commitment: "confirmed" }
      );
      const program = new Program(
        IDL as any,
        readOnlyProvider
      ) as unknown as Program<AgentShield>;
      return { program, client: null };
    }

    const client = new AgentShieldClient(
      connection,
      wallet as any,
      AGENT_SHIELD_PROGRAM_ID
    );

    const provider = new AnchorProviderLib(connection, wallet as any, {
      commitment: "confirmed",
    });
    const program = new Program(
      IDL as any,
      provider
    ) as unknown as Program<AgentShield>;

    return { program, client };
  }, [connection, wallet]);

  return (
    <AnchorContext.Provider value={value}>
      {children}
    </AnchorContext.Provider>
  );
}

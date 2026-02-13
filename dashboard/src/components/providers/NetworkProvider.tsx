"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

export type Network = "devnet" | "mainnet-beta";

export interface NetworkContextValue {
  network: Network;
  setNetwork: (n: Network) => void;
  rpcUrl: string;
}

const RPC_URLS: Record<Network, string> = {
  devnet: process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL
    || "https://api.devnet.solana.com",
  "mainnet-beta": process.env.NEXT_PUBLIC_HELIUS_MAINNET_URL
    || "https://api.mainnet-beta.solana.com",
};

export const NetworkContext = createContext<NetworkContextValue>({
  network: "devnet",
  setNetwork: () => {},
  rpcUrl: RPC_URLS.devnet,
});

export function NetworkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [network, setNetworkState] = useState<Network>("devnet");

  useEffect(() => {
    const stored = localStorage.getItem("agentshield-network");
    if (stored === "mainnet-beta" || stored === "devnet") {
      setNetworkState(stored);
    }
  }, []);

  const setNetwork = useCallback((n: Network) => {
    setNetworkState(n);
    localStorage.setItem("agentshield-network", n);
  }, []);

  return (
    <NetworkContext.Provider
      value={{ network, setNetwork, rpcUrl: RPC_URLS[network] }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

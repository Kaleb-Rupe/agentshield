"use client";

import { useContext } from "react";
import { NetworkContext } from "@/components/providers/NetworkProvider";

export function useNetwork() {
  return useContext(NetworkContext);
}

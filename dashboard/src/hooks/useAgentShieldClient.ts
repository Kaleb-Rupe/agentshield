"use client";

import { useContext } from "react";
import { AnchorContext } from "@/components/providers/AnchorProvider";

export function useAgentShieldClient() {
  const { client, program } = useContext(AnchorContext);
  return { client, program };
}

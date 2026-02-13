"use client";

import { Badge } from "@/components/ui/badge";

export function SolDomainBadge({ domain }: { domain: string }) {
  return (
    <Badge variant="secondary" className="text-xs font-mono">
      {domain}
    </Badge>
  );
}

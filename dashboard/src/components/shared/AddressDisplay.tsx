"use client";

import React, { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Copy, ExternalLink, Check } from "lucide-react";
import { truncateAddress } from "@/lib/format";
import { useNetwork } from "@/hooks/useNetwork";
import { useSnsReverseLookup } from "@/hooks/useSnsReverseLookup";
import { SolDomainBadge } from "./SolDomainBadge";
import { SOLSCAN_URLS } from "@/lib/constants";

export function AddressDisplay({
  address,
  showCopy = true,
  showLink = true,
  showDomain = true,
  className,
}: {
  address: PublicKey | string;
  showCopy?: boolean;
  showLink?: boolean;
  showDomain?: boolean;
  className?: string;
}) {
  const { network } = useNetwork();
  const { lookup } = useSnsReverseLookup();
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState<string | null>(null);
  const addrStr = address.toString();

  useEffect(() => {
    if (!showDomain) return;
    const pk =
      typeof address === "string" ? new PublicKey(address) : address;
    lookup(pk).then(setDomain);
  }, [addrStr, showDomain]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(addrStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const clusterParam =
    network === "devnet" ? "?cluster=devnet" : "";
  const solscanUrl = `${SOLSCAN_URLS[network]}/account/${addrStr}${clusterParam}`;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className || ""}`}>
      <code className="text-sm font-mono">
        {truncateAddress(addrStr)}
      </code>
      {showDomain && domain && <SolDomainBadge domain={domain} />}
      {showCopy && (
        <button
          onClick={copyToClipboard}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Copy address"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
      {showLink && (
        <a
          href={solscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="View on Solscan"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </span>
  );
}

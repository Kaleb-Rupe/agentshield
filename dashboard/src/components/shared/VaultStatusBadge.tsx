import type { VaultStatus } from "@agent-shield/sdk";
import { Badge } from "@/components/ui/badge";
import {
  getVaultStatusLabel,
  getVaultStatusVariant,
} from "@/lib/vaultUtils";

export function VaultStatusBadge({
  status,
}: {
  status: VaultStatus;
}) {
  return (
    <Badge variant={getVaultStatusVariant(status)}>
      {getVaultStatusLabel(status)}
    </Badge>
  );
}

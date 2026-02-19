import { z } from "zod";
import { loadShieldConfig, saveShieldConfig, getCurrentTier } from "../config";

const ACTIONS_SERVER_URL = "https://agent-middleware.vercel.app";

export const upgradeTierSchema = z.object({
  targetTier: z
    .union([z.literal(2), z.literal(3)])
    .describe("Target tier: 2=add TEE custody, 3=add on-chain Vault"),
});

export type UpgradeTierInput = z.infer<typeof upgradeTierSchema>;

/**
 * Upgrade from the current tier to a higher one.
 * Preserves existing policy settings.
 */
export async function upgradeTier(
  _client: any,
  input: UpgradeTierInput,
): Promise<string> {
  const config = loadShieldConfig();
  if (!config) {
    return (
      "AgentShield is not configured yet. " +
      "Use shield_configure to set up from scratch instead of upgrading."
    );
  }

  const currentTier = getCurrentTier(config);

  if (input.targetTier <= currentTier) {
    return `Already at Tier ${currentTier} — cannot downgrade to Tier ${input.targetTier}. Downgrades are not supported via tools.`;
  }

  const lines: string[] = [];

  // ── Upgrade to Tier 2 (add TEE) ──────────────────────────────
  if (input.targetTier >= 2 && !config.layers.tee.enabled) {
    try {
      const response = await fetch(
        `${ACTIONS_SERVER_URL}/api/actions/provision-tee`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ network: config.network }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        return `Error provisioning TEE wallet: ${response.status} ${errorBody}`;
      }

      const teeResult = (await response.json()) as {
        publicKey: string;
        locator: string;
      };

      const oldPubkey = config.wallet.publicKey;

      config.layers.tee = {
        enabled: true,
        locator: teeResult.locator,
        publicKey: teeResult.publicKey,
      };
      config.wallet.type = "crossmint";
      config.wallet.publicKey = teeResult.publicKey;

      lines.push("## Upgraded to Tier 2 (Shield + TEE)");
      lines.push("");
      lines.push(`**TEE Public Key:** ${teeResult.publicKey}`);
      lines.push(`**Locator:** ${teeResult.locator}`);
      lines.push("");
      lines.push(
        "Your agent's private key is now protected in a hardware enclave.",
      );
      lines.push(
        "**Disclosure:** Your TEE wallet is custodied by AgentShield's platform. You can export or migrate later.",
      );
      lines.push("");
      lines.push("### Transfer Funds");
      lines.push(
        `If you have funds in your old wallet (\`${oldPubkey}\`), transfer them to the new TEE wallet:`,
      );
      lines.push(`- **New address:** \`${teeResult.publicKey}\``);
      lines.push(
        "- Use any Solana wallet to send SOL and tokens to the new address.",
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return `Error connecting to AgentShield platform for TEE provisioning: ${msg}`;
    }
  }

  // ── Upgrade to Tier 3 (add Vault) ────────────────────────────
  if (input.targetTier >= 3 && !config.layers.vault.enabled) {
    const params = new URLSearchParams();
    params.set("template", config.template);
    params.set("agentPubkey", config.wallet.publicKey);

    const shield = config.layers.shield;
    if (shield.dailyCapUsd) {
      params.set("dailyCap", shield.dailyCapUsd.toString());
    }

    const actionUrl = `${ACTIONS_SERVER_URL}/api/actions/provision?${params.toString()}`;
    const blinkUrl = `https://dial.to/?action=solana-action:${encodeURIComponent(actionUrl)}`;

    config.layers.vault.enabled = true;

    if (lines.length > 0) {
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    lines.push(
      lines.length === 0
        ? "## Upgraded to Tier 3 (Shield + Vault)"
        : "## Also Adding Tier 3 (On-Chain Vault)",
    );

    if (!config.layers.tee.enabled) {
      lines.push("");
      lines.push(
        "**Warning:** Your agent's private key is stored locally without hardware protection. " +
          "We recommend adding TEE custody for production use.",
      );
    }

    lines.push("");
    lines.push("Sign the vault creation transaction to complete the upgrade:");
    lines.push(`1. **Blink URL:** ${blinkUrl}`);
    lines.push(`2. **Action URL:** ${actionUrl}`);
    lines.push("");
    lines.push(
      "After signing, your vault address will be saved and on-chain policy enforcement will be active.",
    );
    lines.push("");
    lines.push("### Policy Applied");
    lines.push(
      `Your existing policy will be enforced on-chain: $${shield.dailyCapUsd}/day cap, ${shield.allowedProtocols.length} protocols, ${shield.maxLeverageBps} BPS max leverage.`,
    );
  }

  // Save updated config
  saveShieldConfig(config);

  return lines.join("\n");
}

export const upgradeTierTool = {
  name: "shield_upgrade_tier",
  description:
    "Upgrade AgentShield from the current tier to a higher one. " +
    "Tier 2 adds TEE custody (hardware enclave key protection). " +
    "Tier 3 adds on-chain Vault (blockchain-enforced policy). " +
    "Preserves existing policy settings during upgrade.",
  schema: upgradeTierSchema,
  handler: upgradeTier,
};

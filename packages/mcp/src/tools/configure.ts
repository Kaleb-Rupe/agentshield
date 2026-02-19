import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  getConfigDir,
  saveShieldConfig,
  loadShieldConfig,
  type ShieldLocalConfig,
} from "../config";

/**
 * Template definitions for configure tool.
 * Duplicated from actions-server/src/lib/templates.ts for zero-dependency use.
 * Keep in sync — see apps/actions-server/src/lib/templates.ts.
 */
const CONFIGURE_TEMPLATES = {
  conservative: {
    dailyCapUsd: 500,
    allowedProtocols: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
    maxLeverageBps: 0,
    rateLimit: 60,
  },
  moderate: {
    dailyCapUsd: 2000,
    allowedProtocols: [
      "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
      "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
      "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
    ],
    maxLeverageBps: 20000,
    rateLimit: 120,
  },
  aggressive: {
    dailyCapUsd: 10000,
    allowedProtocols: [
      "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
      "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
      "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
      "F1aShdFvR4FHMqAjMbBiGWCHKYaUqR6sFg1MG2pPVfkz",
    ],
    maxLeverageBps: 50000,
    rateLimit: 300,
  },
} as const;

type ConfigureTemplate = keyof typeof CONFIGURE_TEMPLATES;

const ACTIONS_SERVER_URL = "https://agent-middleware.vercel.app";

export const configureSchema = z.object({
  tier: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .describe(
      "Security tier: 1=Shield (software controls), 2=Shield+TEE (hardware enclave), 3=Shield+TEE+Vault (on-chain)",
    ),
  template: z
    .enum(["conservative", "moderate", "aggressive"])
    .optional()
    .default("conservative")
    .describe("Policy template (default: conservative)"),
  dailyCapUsd: z
    .number()
    .optional()
    .describe("Custom daily spending cap in USD (overrides template)"),
  allowedProtocols: z
    .array(z.string())
    .optional()
    .describe("Custom allowed protocol program IDs (base58)"),
  maxLeverageBps: z
    .number()
    .optional()
    .describe("Custom max leverage in basis points"),
  rateLimit: z
    .number()
    .optional()
    .describe("Custom rate limit in transactions per minute"),
  network: z
    .enum(["devnet", "mainnet-beta"])
    .optional()
    .default("devnet")
    .describe("Solana network (default: devnet)"),
  walletPath: z
    .string()
    .optional()
    .describe("Path to existing keypair JSON (generates new if omitted)"),
});

export type ConfigureInput = z.infer<typeof configureSchema>;

export async function configure(
  _client: any,
  input: ConfigureInput,
): Promise<string> {
  try {
    const template =
      CONFIGURE_TEMPLATES[input.template as ConfigureTemplate] ??
      CONFIGURE_TEMPLATES.conservative;

    const dailyCapUsd = input.dailyCapUsd ?? template.dailyCapUsd;
    const allowedProtocols = input.allowedProtocols ?? [
      ...template.allowedProtocols,
    ];
    const maxLeverageBps = input.maxLeverageBps ?? template.maxLeverageBps;
    const rateLimit = input.rateLimit ?? template.rateLimit;

    // ── Tier 1: Shield (Software Controls) ──────────────────────
    let walletPath = input.walletPath || null;
    let walletPublicKey: string;
    let walletType: "keypair" | "crossmint" = "keypair";

    if (walletPath) {
      // Use existing keypair
      const { Keypair } = await import("@solana/web3.js");
      const resolved = walletPath.startsWith("~")
        ? walletPath.replace("~", os.homedir())
        : walletPath;
      const raw = fs.readFileSync(resolved, "utf-8");
      const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
      walletPublicKey = kp.publicKey.toBase58();
    } else {
      // Generate new keypair
      const { Keypair } = await import("@solana/web3.js");
      const kp = Keypair.generate();
      const walletsDir = path.join(getConfigDir(), "wallets");
      if (!fs.existsSync(walletsDir)) {
        fs.mkdirSync(walletsDir, { recursive: true, mode: 0o700 });
      }
      walletPath = path.join(walletsDir, "agent.json");
      fs.writeFileSync(walletPath, JSON.stringify(Array.from(kp.secretKey)), {
        mode: 0o600,
      });
      walletPublicKey = kp.publicKey.toBase58();
    }

    const config: ShieldLocalConfig = {
      version: 1,
      layers: {
        shield: {
          enabled: true,
          dailyCapUsd,
          allowedProtocols,
          maxLeverageBps,
          rateLimit,
        },
        tee: { enabled: false, locator: null, publicKey: null },
        vault: {
          enabled: false,
          address: null,
          owner: null,
          vaultId: null,
        },
      },
      wallet: {
        type: walletType,
        path: walletPath,
        publicKey: walletPublicKey,
      },
      network: input.network as "devnet" | "mainnet-beta",
      template: input.template as ConfigureTemplate,
      configuredAt: new Date().toISOString(),
    };

    const lines: string[] = [
      "## AgentShield Configured — Tier 1 (Shield)",
      "",
      `**Wallet:** ${walletPublicKey}`,
      `**Network:** ${config.network}`,
      `**Template:** ${input.template}`,
      `**Daily Cap:** $${dailyCapUsd}`,
      `**Protocols:** ${allowedProtocols.length}`,
      `**Max Leverage:** ${maxLeverageBps} BPS`,
    ];

    // ── Tier 2: TEE (Hardware Enclave) ──────────────────────────
    if (input.tier >= 2) {
      try {
        const response = await fetch(
          `${ACTIONS_SERVER_URL}/api/actions/provision-tee`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ network: input.network }),
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
        config.layers.tee = {
          enabled: true,
          locator: teeResult.locator,
          publicKey: teeResult.publicKey,
        };
        config.wallet.type = "crossmint";
        // TEE wallet becomes the active wallet
        config.wallet.publicKey = teeResult.publicKey;

        lines[0] = "## AgentShield Configured — Tier 2 (Shield + TEE)";
        lines.push("");
        lines.push("### TEE Custody");
        lines.push(`- **TEE Public Key:** ${teeResult.publicKey}`);
        lines.push(`- **Locator:** ${teeResult.locator}`);
        lines.push(
          "- Your agent's private key is protected in a hardware enclave.",
        );
        lines.push(
          "- **Disclosure:** Your TEE wallet is custodied by AgentShield's platform. You can export or migrate later.",
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `Error connecting to AgentShield platform for TEE provisioning: ${msg}`;
      }
    }

    // ── Tier 3: Vault (On-Chain Enforcement) ────────────────────
    if (input.tier >= 3) {
      // Generate provision Blink URL for user to sign
      const params = new URLSearchParams();
      params.set("template", input.template);
      if (input.dailyCapUsd) {
        params.set("dailyCap", input.dailyCapUsd.toString());
      }
      params.set("agentPubkey", config.wallet.publicKey);

      const actionUrl = `${ACTIONS_SERVER_URL}/api/actions/provision?${params.toString()}`;
      const blinkUrl = `https://dial.to/?action=solana-action:${encodeURIComponent(actionUrl)}`;

      config.layers.vault.enabled = true;
      // Vault address will be set after user signs the transaction

      lines[0] = `## AgentShield Configured — Tier 3 (Shield + ${config.layers.tee.enabled ? "TEE + " : ""}Vault)`;
      lines.push("");
      lines.push("### On-Chain Vault");
      lines.push(
        "Your vault needs one more step — sign the creation transaction:",
      );
      lines.push(`1. **Blink URL:** ${blinkUrl}`);
      lines.push(`2. **Action URL:** ${actionUrl}`);
      lines.push("");
      lines.push(
        "After signing, your vault address will be saved automatically.",
      );

      if (!config.layers.tee.enabled) {
        lines.push("");
        lines.push(
          "**Warning:** Your agent's private key is stored locally without hardware protection. " +
            "We recommend adding TEE custody for production use.",
        );
      }
    }

    // Save config
    saveShieldConfig(config);

    lines.push("");
    lines.push("### Next Steps");
    if (input.tier === 1) {
      lines.push("1. Fund your wallet with SOL and tokens");
      lines.push(
        "2. For production use, consider upgrading to Tier 2 (TEE) for hardware key protection",
      );
      lines.push(
        "3. **Important:** Back up your keypair file. If you lose it, you lose access to your wallet.",
      );
    } else if (input.tier === 2) {
      lines.push("1. Fund your TEE wallet with SOL and tokens");
      lines.push(
        "2. For maximum security (>$5k/day), consider upgrading to Tier 3 (Vault)",
      );
    } else {
      lines.push("1. Sign the vault creation transaction using the link above");
      lines.push("2. Fund your vault with SOL and tokens");
      lines.push("3. You're ready to trade with full protection!");
    }

    return lines.join("\n");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return `Error configuring AgentShield: ${msg}`;
  }
}

export const configureTool = {
  name: "shield_configure",
  description:
    "Set up AgentShield with any security tier. " +
    "Tier 1 (Shield): software spending controls, free, instant. " +
    "Tier 2 (Shield+TEE): adds hardware enclave key protection, free, ~30s. " +
    "Tier 3 (Shield+TEE+Vault): adds on-chain policy enforcement, ~0.003 SOL, ~2min. " +
    "Generates keypair, provisions TEE wallet, and/or creates vault Blink URL as needed.",
  schema: configureSchema,
  handler: configure,
};

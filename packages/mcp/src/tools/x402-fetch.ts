import { z } from "zod";
import type { AgentShieldClient } from "@agent-shield/sdk";
import { formatError } from "../errors";
import type { McpConfig } from "../config";

export const x402FetchSchema = z.object({
  url: z.string().describe("URL of the x402-protected API endpoint"),
  method: z
    .string()
    .optional()
    .default("GET")
    .describe("HTTP method (default: GET)"),
  headers: z
    .record(z.string(), z.string())
    .optional()
    .describe("Additional HTTP headers as key-value pairs"),
  body: z.string().optional().describe("Request body (for POST/PUT)"),
  maxPayment: z
    .string()
    .optional()
    .describe(
      "Maximum payment amount in token base units (rejects if server asks for more)",
    ),
});

export type X402FetchInput = z.input<typeof x402FetchSchema>;

export async function x402Fetch(
  _client: AgentShieldClient,
  config: McpConfig,
  input: X402FetchInput,
): Promise<string> {
  try {
    // Dynamic import to avoid loading x402 code unless needed
    const { shieldWallet, shieldedFetch } = await import("@agent-shield/sdk");
    const { Connection, Keypair } = await import("@solana/web3.js");

    // Load wallet keypair — direct bytes, walletPath file, or agentKeypairPath
    let keypair: InstanceType<typeof Keypair>;
    const cfgAny = config as unknown as Record<string, unknown>;
    if (typeof cfgAny.keypair === "string") {
      // Direct keypair bytes (JSON array string) — programmatic/test usage
      keypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(cfgAny.keypair as string)),
      );
    } else if (config.walletPath) {
      const { loadKeypair } = await import("../config");
      keypair = loadKeypair(config.walletPath);
    } else if (config.agentKeypairPath) {
      const { loadKeypair } = await import("../config");
      keypair = loadKeypair(config.agentKeypairPath);
    } else {
      return "## Error\n\nNo agent keypair configured. Run `shield_configure` first.";
    }

    const wallet = {
      publicKey: keypair.publicKey,
      signTransaction: async <T>(tx: T): Promise<T> => {
        (tx as any).partialSign?.(keypair);
        return tx;
      },
    };

    const connection = new Connection(config.rpcUrl, "confirmed");
    const shielded = shieldWallet(wallet as any, undefined, { connection });

    const fetchInit: RequestInit = {
      method: input.method ?? "GET",
    };
    if (input.headers) {
      fetchInit.headers = input.headers as Record<string, string>;
    }
    if (input.body) {
      fetchInit.body = input.body;
    }

    const res = await shieldedFetch(shielded, input.url, {
      ...fetchInit,
      connection,
    });

    const body = await res.text();
    const x402 = (res as any).x402;

    const lines = [`=== x402 Fetch Result ===`];
    lines.push(`URL: ${input.url}`);
    lines.push(`Status: ${res.status}`);

    if (x402) {
      lines.push(`Paid: ${x402.paid}`);
      if (x402.paid) {
        lines.push(`Amount: ${x402.amountPaid}`);
        lines.push(`Asset: ${x402.asset}`);
        lines.push(`Pay To: ${x402.payTo}`);
        if (x402.settlement?.transaction) {
          lines.push(`Tx: ${x402.settlement.transaction}`);
        }
      }
    }

    lines.push(`Response: ${body.slice(0, 2000)}`);

    return lines.join("\n");
  } catch (error) {
    return formatError(error);
  }
}

export const x402FetchTool = {
  name: "shield_x402_fetch",
  description:
    "Fetch a URL with automatic x402 (HTTP 402 Payment Required) support. " +
    "If the server returns 402 with payment requirements, the agent wallet " +
    "signs a payment transaction (enforced by shield policies) and retries.",
  schema: x402FetchSchema,
  handler: x402Fetch,
};

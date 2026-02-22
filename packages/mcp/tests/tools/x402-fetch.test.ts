import { expect } from "chai";
import { Keypair } from "@solana/web3.js";
import { x402Fetch } from "../../src/tools/x402-fetch";
import { createMockClient } from "../helpers/mock-client";

describe("shield_x402_fetch", () => {
  // Save and restore globalThis.fetch
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  /** Helper: build a valid config with keypair bytes */
  function makeConfig() {
    const kp = Keypair.generate();
    return {
      rpcUrl: "https://api.devnet.solana.com",
      keypair: JSON.stringify(Array.from(kp.secretKey)),
    } as any;
  }

  it("returns error when no keypair configured", async () => {
    const client = createMockClient();
    const config = { rpcUrl: "https://api.devnet.solana.com" } as any;
    const result = await x402Fetch(client as any, config, {
      url: "https://example.com/api",
    });
    expect(result).to.include("Error");
    expect(result).to.include("keypair");
  });

  it("returns non-402 responses directly", async () => {
    globalThis.fetch = (async () =>
      new Response('{"ok":true}', { status: 200 })) as any;

    const client = createMockClient();
    const config = makeConfig();

    const result = await x402Fetch(client as any, config, {
      url: "https://example.com/free",
    });
    expect(result).to.include("Status: 200");
    expect(result).to.include("x402 Fetch Result");
  });

  it("returns 402 without payment header as-is", async () => {
    globalThis.fetch = (async () =>
      new Response("Payment Required", { status: 402 })) as any;

    const client = createMockClient();
    const config = makeConfig();

    const result = await x402Fetch(client as any, config, {
      url: "https://example.com/plain-402",
    });
    expect(result).to.include("Status: 402");
  });

  it("includes x402 metadata when payment is made", async () => {
    // Simulate a 402 → 200 flow
    const paymentRequired = Buffer.from(
      JSON.stringify({
        x402Version: 2,
        resource: {
          url: "https://example.com/paid",
          description: "Test",
          mimeType: "application/json",
        },
        accepts: [
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            amount: "1000",
            payTo: "11111111111111111111111111111111",
            maxTimeoutSeconds: 60,
            extra: {},
          },
        ],
      }),
    ).toString("base64");

    globalThis.fetch = (async (_url: any, init?: any) => {
      const headers = init?.headers;
      const hasPayment =
        headers instanceof Headers && headers.has("PAYMENT-SIGNATURE");
      if (hasPayment) {
        const settlement = Buffer.from(
          JSON.stringify({
            success: true,
            transaction: "txhash123",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          }),
        ).toString("base64");
        return new Response('{"data":"ok"}', {
          status: 200,
          headers: { "PAYMENT-RESPONSE": settlement },
        });
      }
      return new Response(null, {
        status: 402,
        headers: { "PAYMENT-REQUIRED": paymentRequired },
      });
    }) as any;

    const client = createMockClient();
    const config = makeConfig();

    const result = await x402Fetch(client as any, config, {
      url: "https://example.com/paid",
    });
    expect(result).to.include("Paid: true");
    expect(result).to.include("Amount: 1000");
  });

  it("returns error on policy denial", async () => {
    const paymentRequired = Buffer.from(
      JSON.stringify({
        x402Version: 2,
        resource: {
          url: "https://example.com/expensive",
          description: "Expensive",
          mimeType: "application/json",
        },
        accepts: [
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            amount: "99999999999", // Very large amount
            payTo: "11111111111111111111111111111111",
            maxTimeoutSeconds: 60,
            extra: {},
          },
        ],
      }),
    ).toString("base64");

    globalThis.fetch = (async () =>
      new Response(null, {
        status: 402,
        headers: { "PAYMENT-REQUIRED": paymentRequired },
      })) as any;

    const client = createMockClient();
    const config = makeConfig();

    const result = await x402Fetch(client as any, config, {
      url: "https://example.com/expensive",
    });
    // Should catch the ShieldDeniedError and return formatted error
    expect(result).to.include("Error");
  });
});

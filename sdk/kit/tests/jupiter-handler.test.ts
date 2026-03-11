import { expect } from "chai";
import {
  deserializeJupiterInstruction,
  JupiterHandler,
  type JupiterSerializedInstruction,
} from "../src/integrations/jupiter-handler.js";
import { AccountRole } from "@solana/kit";
import type { Address } from "@solana/kit";
import { ActionType } from "../src/generated/types/actionType.js";

describe("jupiter-handler", () => {
  describe("deserializeJupiterInstruction", () => {
    it("converts programId to programAddress", () => {
      const raw: JupiterSerializedInstruction = {
        programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        accounts: [],
        data: btoa("hello"), // base64
      };
      const ix = deserializeJupiterInstruction(raw);
      expect(ix.programAddress).to.equal(
        "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      );
    });

    it("maps account roles correctly", () => {
      const raw: JupiterSerializedInstruction = {
        programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        accounts: [
          { pubkey: "Acct1111111111111111111111111111111111111111", isSigner: true, isWritable: true },
          { pubkey: "Acct2222222222222222222222222222222222222222", isSigner: true, isWritable: false },
          { pubkey: "Acct3333333333333333333333333333333333333333", isSigner: false, isWritable: true },
          { pubkey: "Acct4444444444444444444444444444444444444444", isSigner: false, isWritable: false },
        ],
        data: btoa(""),
      };
      const ix = deserializeJupiterInstruction(raw);
      expect(ix.accounts).to.have.length(4);
      expect(ix.accounts![0].role).to.equal(AccountRole.WRITABLE_SIGNER);
      expect(ix.accounts![1].role).to.equal(AccountRole.READONLY_SIGNER);
      expect(ix.accounts![2].role).to.equal(AccountRole.WRITABLE);
      expect(ix.accounts![3].role).to.equal(AccountRole.READONLY);
    });

    it("decodes base64 data to Uint8Array", () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const b64 = btoa(String.fromCharCode(...original));
      const raw: JupiterSerializedInstruction = {
        programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        accounts: [],
        data: b64,
      };
      const ix = deserializeJupiterInstruction(raw);
      expect(ix.data).to.be.instanceOf(Uint8Array);
      expect(ix.data).to.deep.equal(original);
    });

    it("handles empty accounts and data", () => {
      const raw: JupiterSerializedInstruction = {
        programId: "11111111111111111111111111111111",
        accounts: [],
        data: btoa(""),
      };
      const ix = deserializeJupiterInstruction(raw);
      expect(ix.accounts).to.have.length(0);
      expect(ix.data).to.have.length(0);
    });
  });

  describe("JupiterHandler metadata", () => {
    const handler = new JupiterHandler();

    it("has protocolId = jupiter", () => {
      expect(handler.metadata.protocolId).to.equal("jupiter");
    });

    it("has Jupiter program ID", () => {
      expect(handler.metadata.programIds).to.have.length(1);
      expect(handler.metadata.programIds[0]).to.equal(
        "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      );
    });

    it("supports swap action", () => {
      const swapAction = handler.metadata.supportedActions.get("swap");
      expect(swapAction).to.exist;
      expect(swapAction!.actionType).to.equal(ActionType.Swap);
      expect(swapAction!.isSpending).to.be.true;
    });

    it("compose throws on unsupported action", async () => {
      const ctx = {
        rpc: {} as any,
        network: "devnet" as const,
        vault: "V111111111111111111111111111111111111111111" as Address,
        owner: "O111111111111111111111111111111111111111111" as Address,
        vaultId: 0n,
        agent: "A111111111111111111111111111111111111111111" as Address,
      };
      try {
        await handler.compose(ctx, "liquidate", {});
        expect.fail("should have thrown");
      } catch (e: any) {
        expect(e.message).to.include("does not support action");
      }
    });

    it("summarize produces readable output for swap", () => {
      const summary = handler.summarize("swap", {
        inputMint: "USDC",
        outputMint: "SOL",
        amount: "1000000",
      });
      expect(summary).to.include("USDC");
      expect(summary).to.include("SOL");
      expect(summary).to.include("Jupiter");
    });

    it("summarize handles unknown action", () => {
      const summary = handler.summarize("unknown", {});
      expect(summary).to.include("Jupiter");
    });
  });
});

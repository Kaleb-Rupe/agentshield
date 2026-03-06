import { expect } from "chai";
import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import type { WalletLike } from "@phalnx/sdk";
import { createClientSideWallet, createShieldedWallet } from "../src";

function createMockWallet(): WalletLike {
  const kp = Keypair.generate();
  return {
    publicKey: kp.publicKey,
    async signTransaction<T extends Transaction | VersionedTransaction>(
      tx: T,
    ): Promise<T> {
      return tx;
    },
  };
}

describe("Factory (E2 split)", () => {
  describe("createClientSideWallet", () => {
    it("creates a ShieldedWallet synchronously", () => {
      const raw = createMockWallet();
      const wallet = createClientSideWallet({ wallet: raw });
      expect(wallet.publicKey.equals(raw.publicKey)).to.be.true;
      expect(wallet.isPaused).to.be.false;
      expect(wallet.isHardened).to.be.false;
    });

    it("applies policies", () => {
      const wallet = createClientSideWallet({
        wallet: createMockWallet(),
        policies: { maxSpend: "500 USDC/day" },
      });
      const summary = wallet.getSpendingSummary();
      expect(summary.tokens.length).to.be.greaterThan(0);
    });

    it("wires callbacks to logger", () => {
      const logs: string[] = [];
      const logger = {
        info: (...args: any[]) => logs.push(args.join(" ")),
        warn: (...args: any[]) => logs.push("WARN:" + args.join(" ")),
      };

      const wallet = createClientSideWallet({
        wallet: createMockWallet(),
        policies: { maxSpend: "100 USDC/day" },
        logger,
      });

      wallet.pause();
      expect(logs.some((l) => l.includes("paused"))).to.be.true;

      wallet.resume();
      expect(logs.some((l) => l.includes("resumed"))).to.be.true;
    });
  });

  describe("createShieldedWallet (deprecated)", () => {
    it("still works for client-side (backward compat)", () => {
      const raw = createMockWallet();
      const result = createShieldedWallet({ wallet: raw });
      // Without hardenOptions, returns ShieldedWallet synchronously
      expect(result).to.have.property("publicKey");
      expect(result).to.have.property("isPaused");
    });
  });
});

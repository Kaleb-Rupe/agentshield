import { expect } from "chai";
import { app } from "../src/app";

describe("Escrow Routes", () => {
  describe("GET /escrow-create", () => {
    it("returns action metadata", async () => {
      const res = await app.request("/escrow-create");
      expect(res.status).to.equal(200);
      const body = (await res.json()) as any;
      expect(body.title).to.include("Escrow");
      expect(body.label).to.equal("Create Escrow");
      expect(body.links.actions).to.have.length(1);
      expect(body.links.actions[0].parameters).to.have.length(4);
    });
  });

  describe("POST /escrow-create", () => {
    it("returns 400 without required params", async () => {
      const res = await app.request("/escrow-create", { method: "POST" });
      expect(res.status).to.equal(400);
      const body = (await res.json()) as any;
      expect(body.error).to.include("Missing");
    });

    it("returns placeholder transaction with params", async () => {
      const res = await app.request(
        "/escrow-create?destination=ABC&amount=100&mint=USDC&duration=3600",
        { method: "POST" },
      );
      expect(res.status).to.equal(200);
      const body = (await res.json()) as any;
      expect(body.transaction).to.equal("PLACEHOLDER");
      expect(body.message).to.include("ABC");
    });
  });

  describe("OPTIONS /escrow-create", () => {
    it("returns 204", async () => {
      const res = await app.request("/escrow-create", { method: "OPTIONS" });
      expect(res.status).to.equal(204);
    });
  });

  describe("GET /escrow-settle", () => {
    it("returns action metadata", async () => {
      const res = await app.request("/escrow-settle");
      expect(res.status).to.equal(200);
      const body = (await res.json()) as any;
      expect(body.title).to.include("Settle");
      expect(body.links.actions[0].parameters).to.have.length(1);
    });
  });

  describe("POST /escrow-settle", () => {
    it("returns 400 without escrow param", async () => {
      const res = await app.request("/escrow-settle", { method: "POST" });
      expect(res.status).to.equal(400);
    });

    it("returns placeholder with escrow param", async () => {
      const res = await app.request("/escrow-settle?escrow=XYZ123", {
        method: "POST",
      });
      expect(res.status).to.equal(200);
      const body = (await res.json()) as any;
      expect(body.message).to.include("XYZ123");
    });
  });

  describe("OPTIONS /escrow-settle", () => {
    it("returns 204", async () => {
      const res = await app.request("/escrow-settle", { method: "OPTIONS" });
      expect(res.status).to.equal(204);
    });
  });

  describe("GET /escrow-refund", () => {
    it("returns action metadata", async () => {
      const res = await app.request("/escrow-refund");
      expect(res.status).to.equal(200);
      const body = (await res.json()) as any;
      expect(body.title).to.include("Refund");
      expect(body.description).to.include("Cap is NOT reversed");
    });
  });

  describe("POST /escrow-refund", () => {
    it("returns 400 without escrow param", async () => {
      const res = await app.request("/escrow-refund", { method: "POST" });
      expect(res.status).to.equal(400);
    });

    it("returns placeholder with escrow param", async () => {
      const res = await app.request("/escrow-refund?escrow=ABC789", {
        method: "POST",
      });
      expect(res.status).to.equal(200);
      const body = (await res.json()) as any;
      expect(body.message).to.include("ABC789");
    });
  });

  describe("OPTIONS /escrow-refund", () => {
    it("returns 204", async () => {
      const res = await app.request("/escrow-refund", { method: "OPTIONS" });
      expect(res.status).to.equal(204);
    });
  });
});

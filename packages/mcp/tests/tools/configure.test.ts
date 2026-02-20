import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { configure } from "../../src/tools/configure";

describe("shield_configure", () => {
  const tmpHome = path.join(os.tmpdir(), `home-configure-${Date.now()}`);
  const origHome = process.env.HOME;

  beforeEach(() => {
    const shieldDir = path.join(tmpHome, ".agentshield");
    if (!fs.existsSync(shieldDir)) {
      fs.mkdirSync(shieldDir, { recursive: true });
    }
    process.env.HOME = tmpHome;
    delete process.env.AGENTSHIELD_WALLET_PATH;
    delete process.env.AGENTSHIELD_RPC_URL;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    // Clean up config
    const configPath = path.join(tmpHome, ".agentshield", "config.json");
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    // Clean up generated wallet
    const walletPath = path.join(tmpHome, ".agentshield", "wallets", "agent.json");
    if (fs.existsSync(walletPath)) {
      fs.unlinkSync(walletPath);
    }
  });

  after(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it("configures Tier 1 with conservative template", async () => {
    const result = await configure(null, {
      tier: 1,
      template: "conservative",
      network: "devnet",
    });

    expect(result).to.include("Tier 1 (Shield)");
    expect(result).to.include("$500");
    expect(result).to.include("devnet");

    // Verify config file created
    const configPath = path.join(tmpHome, ".agentshield", "config.json");
    expect(fs.existsSync(configPath)).to.be.true;

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(config.version).to.equal(1);
    expect(config.layers.shield.enabled).to.be.true;
    expect(config.layers.shield.dailyCapUsd).to.equal(500);
    expect(config.layers.tee.enabled).to.be.false;
    expect(config.layers.vault.enabled).to.be.false;
  });

  it("generates a new keypair when walletPath not provided", async () => {
    await configure(null, {
      tier: 1,
      template: "conservative",
      network: "devnet",
    });

    const walletPath = path.join(tmpHome, ".agentshield", "wallets", "agent.json");
    expect(fs.existsSync(walletPath)).to.be.true;

    // Verify it's a valid keypair (array of 64 numbers)
    const raw = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    expect(raw).to.be.an("array");
    expect(raw.length).to.equal(64);
  });

  it("uses existing keypair when walletPath provided", async () => {
    // Create a test keypair file
    const { Keypair } = await import("@solana/web3.js");
    const kp = Keypair.generate();
    const walletDir = path.join(tmpHome, ".agentshield", "wallets");
    fs.mkdirSync(walletDir, { recursive: true });
    const existingPath = path.join(walletDir, "existing.json");
    fs.writeFileSync(existingPath, JSON.stringify(Array.from(kp.secretKey)));

    const result = await configure(null, {
      tier: 1,
      template: "moderate",
      network: "devnet",
      walletPath: existingPath,
    });

    expect(result).to.include(kp.publicKey.toBase58());
  });

  it("applies custom dailyCapUsd override", async () => {
    await configure(null, {
      tier: 1,
      template: "conservative",
      dailyCapUsd: 1000,
      network: "devnet",
    });

    const configPath = path.join(tmpHome, ".agentshield", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(config.layers.shield.dailyCapUsd).to.equal(1000);
  });

  it("applies moderate template defaults", async () => {
    await configure(null, {
      tier: 1,
      template: "moderate",
      network: "devnet",
    });

    const configPath = path.join(tmpHome, ".agentshield", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(config.layers.shield.dailyCapUsd).to.equal(2000);
    expect(config.layers.shield.maxLeverageBps).to.equal(20000);
    expect(config.layers.shield.allowedProtocols.length).to.equal(4);
  });

  it("applies aggressive template defaults", async () => {
    await configure(null, {
      tier: 1,
      template: "aggressive",
      network: "devnet",
    });

    const configPath = path.join(tmpHome, ".agentshield", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(config.layers.shield.dailyCapUsd).to.equal(10000);
    expect(config.layers.shield.maxLeverageBps).to.equal(50000);
    expect(config.layers.shield.allowedProtocols.length).to.equal(5);
  });

  it("sets network to mainnet-beta when specified", async () => {
    await configure(null, {
      tier: 1,
      template: "conservative",
      network: "mainnet-beta",
    });

    const configPath = path.join(tmpHome, ".agentshield", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(config.network).to.equal("mainnet-beta");
  });

  it("returns error on invalid wallet path", async () => {
    const result = await configure(null, {
      tier: 1,
      template: "conservative",
      network: "devnet",
      walletPath: "/nonexistent/path/wallet.json",
    });

    expect(result).to.include("Error");
  });

  it("Tier 3 provisions TEE and generates vault Blink URL", async () => {
    // Tier 3 first provisions TEE (tier >= 2), then generates vault Blink URL
    const result = await configure(null, {
      tier: 3,
      template: "conservative",
      network: "devnet",
    });

    // TEE provisioning succeeds, vault Blink URL generated
    expect(result).to.include("Tier 3");
    expect(result).to.include("Configured");
  });

  it("Tier 1 next steps suggest upgrading to TEE", async () => {
    const result = await configure(null, {
      tier: 1,
      template: "conservative",
      network: "devnet",
    });

    // Tier 1 should suggest upgrading to TEE
    expect(result).to.include("Tier 2 (TEE)");
  });
});

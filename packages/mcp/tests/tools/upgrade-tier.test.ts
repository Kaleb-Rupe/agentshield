import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { upgradeTier } from "../../src/tools/upgrade-tier";

describe("shield_upgrade_tier", () => {
  const tmpHome = path.join(os.tmpdir(), `home-upgrade-${Date.now()}`);
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
    const configPath = path.join(tmpHome, ".agentshield", "config.json");
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  });

  after(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  function writeConfig(overrides: Record<string, any> = {}) {
    const config = {
      version: 1,
      layers: {
        shield: {
          enabled: true,
          dailyCapUsd: 500,
          allowedProtocols: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
          maxLeverageBps: 0,
          rateLimit: 60,
        },
        tee: { enabled: false, locator: null, publicKey: null },
        vault: { enabled: false, address: null, owner: null, vaultId: null },
      },
      wallet: {
        type: "keypair",
        path: "~/.agentshield/wallets/agent.json",
        publicKey: "11111111111111111111111111111111",
      },
      network: "devnet",
      template: "conservative",
      configuredAt: "2026-01-01T00:00:00Z",
      ...overrides,
    };
    fs.writeFileSync(
      path.join(tmpHome, ".agentshield", "config.json"),
      JSON.stringify(config),
    );
  }

  it("returns not-configured when no config exists", async () => {
    const result = await upgradeTier(null, { targetTier: 2 });
    expect(result).to.include("not configured");
  });

  it("rejects downgrade from higher tier", async () => {
    writeConfig({
      layers: {
        shield: {
          enabled: true,
          dailyCapUsd: 500,
          allowedProtocols: [],
          maxLeverageBps: 0,
          rateLimit: 60,
        },
        tee: {
          enabled: true,
          locator: "loc",
          publicKey: "22222222222222222222222222222222",
        },
        vault: { enabled: false, address: null, owner: null, vaultId: null },
      },
    });

    const result = await upgradeTier(null, { targetTier: 2 });
    expect(result).to.include("Already at Tier 2");
  });

  it("generates Blink URL when upgrading to Tier 3", async () => {
    writeConfig({
      layers: {
        shield: {
          enabled: true,
          dailyCapUsd: 500,
          allowedProtocols: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
          maxLeverageBps: 0,
          rateLimit: 60,
        },
        tee: {
          enabled: true,
          locator: "tee-loc",
          publicKey: "22222222222222222222222222222222",
        },
        vault: { enabled: false, address: null, owner: null, vaultId: null },
      },
      wallet: {
        type: "crossmint",
        path: null,
        publicKey: "22222222222222222222222222222222",
      },
    });

    const result = await upgradeTier(null, { targetTier: 3 });
    expect(result).to.include("Tier 3");
    expect(result).to.include("Blink URL");
    expect(result).to.include("dial.to");

    // Verify config was updated
    const configPath = path.join(tmpHome, ".agentshield", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(config.layers.vault.enabled).to.be.true;
  });

  it("provisions TEE first when upgrading to Tier 3 without TEE", async () => {
    writeConfig();

    const result = await upgradeTier(null, { targetTier: 3 });
    // TEE is provisioned first, then vault Blink URL generated
    expect(result).to.include("Upgraded to Tier 2");
    expect(result).to.include("Tier 3");
  });

  it("preserves existing policy on upgrade", async () => {
    writeConfig({
      layers: {
        shield: {
          enabled: true,
          dailyCapUsd: 2000,
          allowedProtocols: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
          maxLeverageBps: 20000,
          rateLimit: 120,
        },
        tee: {
          enabled: true,
          locator: "tee-loc",
          publicKey: "22222222222222222222222222222222",
        },
        vault: { enabled: false, address: null, owner: null, vaultId: null },
      },
      wallet: {
        type: "crossmint",
        path: null,
        publicKey: "22222222222222222222222222222222",
      },
    });

    const result = await upgradeTier(null, { targetTier: 3 });
    expect(result).to.include("$2000");
    expect(result).to.include("20000 BPS");
  });
});

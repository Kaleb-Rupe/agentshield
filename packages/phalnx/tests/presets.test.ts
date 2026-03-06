import { expect } from "chai";
import { PRESETS, PRESET_LABELS, getPresetConfig } from "../src/presets";

describe("presets", () => {
  describe("PRESETS", () => {
    it("has three preset configurations", () => {
      expect(Object.keys(PRESETS)).to.have.lengthOf(3);
      expect(PRESETS).to.have.property("conservative");
      expect(PRESETS).to.have.property("moderate");
      expect(PRESETS).to.have.property("aggressive");
    });

    it("conservative has correct values", () => {
      expect(PRESETS.conservative.dailyCapUsd).to.equal(100);
      expect(PRESETS.conservative.maxSlippageBps).to.equal(100);
      expect(PRESETS.conservative.protocols).to.deep.equal(["jupiter"]);
    });

    it("moderate has correct values", () => {
      expect(PRESETS.moderate.dailyCapUsd).to.equal(500);
      expect(PRESETS.moderate.maxSlippageBps).to.equal(300);
      expect(PRESETS.moderate.protocols).to.deep.equal(["all"]);
    });

    it("aggressive has correct values", () => {
      expect(PRESETS.aggressive.dailyCapUsd).to.equal(2000);
      expect(PRESETS.aggressive.maxSlippageBps).to.equal(500);
      expect(PRESETS.aggressive.protocols).to.deep.equal(["all"]);
    });
  });

  describe("PRESET_LABELS", () => {
    it("has labels for all presets including custom", () => {
      expect(Object.keys(PRESET_LABELS)).to.have.lengthOf(4);
      expect(PRESET_LABELS).to.have.property("conservative");
      expect(PRESET_LABELS).to.have.property("moderate");
      expect(PRESET_LABELS).to.have.property("aggressive");
      expect(PRESET_LABELS).to.have.property("custom");
    });
  });

  describe("getPresetConfig", () => {
    it("returns config for valid presets", () => {
      const config = getPresetConfig("conservative");
      expect(config).to.not.be.null;
      expect(config!.dailyCapUsd).to.equal(100);
    });

    it("returns null for custom preset", () => {
      expect(getPresetConfig("custom")).to.be.null;
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  applyConfig,
  configureGlobalRegions,
} from "../src/configureGlobalRegions";
import globalRegions from "../src/reducers/globalRegions";

describe("configureGlobalRegions", () => {
  it("registers settings and the addon reducer", () => {
    const config = { settings: {}, addonReducers: {} };
    configureGlobalRegions(config, {
      activeRegion: "secondary",
      rootPath: "/site",
      regions: [
        { name: "primary", maxLength: 2 },
        { name: "secondary", allowedBlocks: ["slate"] },
      ],
    });

    expect(config.settings.globalRegions).toMatchObject({
      activeRegion: "secondary",
      rootPath: "/site",
      regions: {
        primary: { maxLength: 2 },
        secondary: { allowedBlocks: ["slate"] },
      },
    });
    expect(config.addonReducers.globalRegions).toBe(globalRegions);
  });

  it("has a generic default applyConfig", () => {
    const config = { settings: {}, addonReducers: {} };
    expect(applyConfig(config)).toBe(config);
    expect(config.settings.globalRegions.activeRegion).toBe("default");
  });
});

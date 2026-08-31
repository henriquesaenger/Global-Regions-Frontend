import { describe, expect, it } from "vitest";
import {
  createGlobalRegion,
  createRegionFromDefinition,
  extractGlobalRegions,
  isEmptyGlobalRegion,
  normalizeGlobalRegions,
  resolveGlobalRegion,
  resolveGlobalRegionName,
} from "../src/helpers/globalRegions";

describe("global region helpers", () => {
  it("creates valid empty blocks data", () => {
    expect(createGlobalRegion()).toEqual({
      blocks: {},
      blocks_layout: { items: [] },
    });
  });

  it("normalizes configured regions and enforces block constraints", () => {
    const regions = normalizeGlobalRegions(
      {
        primary: {
          blocks: {
            first: { "@type": "slate" },
            second: { "@type": "image" },
            third: { "@type": "slate" },
          },
          blocks_layout: { items: ["first", "missing", "second", "third"] },
        },
      },
      {
        primary: { allowedBlocks: ["slate"], maxLength: 1 },
        secondary: {},
      },
    );

    expect(regions.primary.blocks_layout.items).toEqual(["first"]);
    expect(regions.primary.blocks).toEqual({
      first: { "@type": "slate" },
    });
    expect(regions).not.toHaveProperty("secondary");
  });

  it("preserves null and absence while resolving an active name", () => {
    const definitions = { primary: {}, secondary: {} };
    const regions = normalizeGlobalRegions({ primary: null }, definitions);
    expect(regions).toEqual({ primary: null });
    expect(resolveGlobalRegionName({}, "missing", definitions)).toBe("primary");
    expect(resolveGlobalRegion(regions, "primary", definitions)).toBeNull();
    expect(
      resolveGlobalRegion(regions, "secondary", definitions),
    ).toBeUndefined();
  });

  it("extracts independent root fields", () => {
    expect(
      extractGlobalRegions(
        {
          global_regions: null,
          global_regions: { blocks: {}, blocks_layout: { items: [] } },
        },
        {
          primary: { fieldName: "global_regions" },
          secondary: { fieldName: "global_regions" },
          aside: { fieldName: "aside_region" },
        },
      ),
    ).toEqual({
      primary: null,
      secondary: createGlobalRegion(),
    });
  });

  it("creates an editing draft from initialRegion or createDefault", () => {
    expect(
      createRegionFromDefinition({
        initialRegion: {
          blocks: { one: { "@type": "slate" } },
          blocks_layout: { items: ["one"] },
        },
      }).blocks_layout.items,
    ).toEqual(["one"]);
    expect(
      createRegionFromDefinition(
        {
          createDefault: ({ name }) => ({
            blocks: { [name]: { "@type": "slate" } },
            blocks_layout: { items: [name] },
          }),
        },
        { name: "primary" },
      ).blocks_layout.items,
    ).toEqual(["primary"]);
  });

  it("treats missing or itemless regions as empty", () => {
    expect(isEmptyGlobalRegion(null)).toBe(true);
    expect(isEmptyGlobalRegion(undefined)).toBe(true);
    expect(isEmptyGlobalRegion(createGlobalRegion())).toBe(true);
    expect(
      isEmptyGlobalRegion({
        blocks: { one: { "@type": "slate" } },
        blocks_layout: { items: ["one"] },
      }),
    ).toBe(false);
  });
});

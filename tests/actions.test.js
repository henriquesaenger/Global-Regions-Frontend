import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@plone/volto/registry", () => ({
  default: {
    settings: {
      globalRegions: {
        rootPath: "/",
        regions: {
          primary: { fieldName: "global_regions" },
          secondary: { fieldName: "global_regions" },
        },
      },
    },
  },
}));

import {
  bootstrapGlobalRegions,
  fetchGlobalRegions,
  saveGlobalRegion,
  saveGlobalRegions,
} from "../src/actions/globalRegions";
import { FETCH_GLOBAL_REGIONS, SAVE_GLOBAL_REGIONS } from "../src/constants";

describe("global regions actions", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("fetches the site root without using content state", () => {
    expect(fetchGlobalRegions()).toMatchObject({
      type: FETCH_GLOBAL_REGIONS,
      definitions: {
        primary: { fieldName: "global_regions" },
        secondary: { fieldName: "global_regions" },
      },
      request: { op: "get", path: "/" },
    });
  });

  it("patches only the selected region field", () => {
    const action = saveGlobalRegion(
      "primary",
      { blocks: {}, blocks_layout: { items: [] } },
      { etag: '"revision-1"' },
    );

    expect(action).toMatchObject({
      type: SAVE_GLOBAL_REGIONS,
      regionName: "primary",
      fieldName: "global_regions",
      request: {
        op: "patch",
        path: "/",
        headers: {
          Prefer: "return=representation",
          "If-Match": '"revision-1"',
        },
        data: {
          global_regions: { blocks: {}, blocks_layout: { items: [] } },
        },
      },
    });
    expect(action.request.data).not.toHaveProperty("global_regions");
  });

  it("does not send If-Match when no ETag is available", () => {
    expect(
      saveGlobalRegion("secondary", {
        blocks: {},
        blocks_layout: { items: [] },
      }).request.headers,
    ).toEqual({
      Prefer: "return=representation",
    });
  });

  it("keeps a singular-only plural compatibility wrapper", () => {
    expect(
      saveGlobalRegions({
        secondary: { blocks: {}, blocks_layout: { items: [] } },
      }).request.data,
    ).toEqual({
      global_regions: { blocks: {}, blocks_layout: { items: [] } },
    });
    expect(() => saveGlobalRegions({ primary: {}, secondary: {} })).toThrow(
      /exactly one region/,
    );
  });

  it("provides an explicit SSR bootstrap", async () => {
    const dispatch = vi.fn(() => Promise.resolve("loaded"));
    const store = {
      dispatch,
      getState: () => ({ globalRegions: { loaded: false } }),
    };

    await expect(bootstrapGlobalRegions(store)).resolves.toBe("loaded");
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_GLOBAL_REGIONS }),
    );
  });

  it("skips SSR fetching when preloaded", async () => {
    const dispatch = vi.fn();
    const data = { primary: {} };
    const store = {
      dispatch,
      getState: () => ({ globalRegions: { loaded: true, data } }),
    };

    await expect(bootstrapGlobalRegions(store)).resolves.toBe(data);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

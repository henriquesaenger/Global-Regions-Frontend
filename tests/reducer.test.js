import { describe, expect, it } from "vitest";
import globalRegions, { initialState } from "../src/reducers/globalRegions";
import { FETCH_GLOBAL_REGIONS, SAVE_GLOBAL_REGIONS } from "../src/constants";

const definitions = {
  primary: { fieldName: "global_regions" },
  secondary: { fieldName: "global_regions" },
};

describe("globalRegions reducer", () => {
  it("stores its own GET representation and ETag", () => {
    const state = globalRegions(
      { ...initialState, loading: true },
      {
        type: `${FETCH_GLOBAL_REGIONS}_SUCCESS`,
        definitions,
        result: {
          "@etag": '"one"',
          "@components": {
            actions: {
              object: [{ id: "view" }, { id: "edit" }],
            },
          },
          global_regions: null,
          global_regions: { blocks: {}, blocks_layout: { items: [] } },
        },
      },
    );

    expect(state.loaded).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.etag).toBe('"one"');
    expect(state.canEdit).toBe(true);
    expect(state.data).toEqual({
      primary: null,
      secondary: { blocks: {}, blocks_layout: { items: [] } },
    });
  });

  it("updates only the saved region if PATCH has no response body", () => {
    const submitted = { blocks: {}, blocks_layout: { items: [] } };
    const secondary = {
      blocks: { secondary: { "@type": "slate" } },
      blocks_layout: { items: ["secondary"] },
    };
    const state = globalRegions(
      {
        ...initialState,
        data: { primary: null, secondary },
        etag: '"one"',
        saving: true,
      },
      {
        type: `${SAVE_GLOBAL_REGIONS}_SUCCESS`,
        fieldName: "global_regions",
        regionName: "primary",
        definitions,
        region: submitted,
        result: undefined,
      },
    );

    expect(state.data).toEqual({ primary: submitted, secondary });
    expect(state.etag).toBe('"one"');
    expect(state.saving).toBe(false);
  });

  it("exposes API failures without replacing loaded data", () => {
    const data = { primary: { blocks: {}, blocks_layout: { items: [] } } };
    const error = { status: 412 };
    const state = globalRegions(
      { ...initialState, data, loaded: true, saving: true },
      { type: `${SAVE_GLOBAL_REGIONS}_FAIL`, error },
    );

    expect(state.data).toBe(data);
    expect(state.error).toBe(error);
    expect(state.saving).toBe(false);
  });
});

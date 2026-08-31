import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: {
    activeRegionName: "primary",
    definitions: {
      primary: { fieldName: "global_regions" },
    },
    editingRegion: null,
    regions: { primary: null },
  },
}));

vi.mock("../src/context/GlobalRegionsContext", () => ({
  useGlobalRegions: () => mocks.context,
}));
vi.mock("../src/components/GlobalBlocksRegionEdit", () => ({
  default: () => <div data-testid="edit" />,
}));
vi.mock("../src/components/GlobalBlocksRegionView", () => ({
  default: ({ region }) => (
    <div data-testid="view">{region.blocks_layout.items.length}</div>
  ),
}));

import GlobalBlocksRegion from "../src/components/GlobalBlocksRegion";

describe("GlobalBlocksRegion fallback", () => {
  beforeEach(() => {
    mocks.context.regions = { primary: null };
    mocks.context.editingRegion = null;
  });

  it("renders fallback for a null region", () => {
    render(
      <GlobalBlocksRegion
        name="primary"
        fallback={<div data-testid="fallback">legacy primary</div>}
      />,
    );

    expect(screen.getByTestId("fallback").textContent).toBe("legacy primary");
    expect(screen.queryByTestId("view")).toBeNull();
  });

  it("does not render fallback for a persisted empty region", () => {
    mocks.context.regions = {
      primary: { blocks: {}, blocks_layout: { items: [] } },
    };
    render(
      <GlobalBlocksRegion
        name="primary"
        fallback={<div data-testid="fallback">legacy primary</div>}
      />,
    );

    expect(screen.getByTestId("view").textContent).toBe("0");
    expect(screen.queryByTestId("fallback")).toBeNull();
  });
});

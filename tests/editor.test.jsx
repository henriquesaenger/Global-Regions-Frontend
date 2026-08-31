import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cancelEditing: vi.fn(),
  saveRegion: vi.fn(() => Promise.resolve()),
  context: null,
}));

mocks.context = {
  activeRegionName: "primary",
  cancelEditing: mocks.cancelEditing,
  definitions: {
    primary: {
      fieldName: "global_regions",
      allowedBlocks: ["slate"],
      maxLength: 1,
      initialRegion: {
        blocks: { slate: { "@type": "slate" } },
        blocks_layout: { items: ["slate"] },
      },
    },
  },
  regions: {
    primary: null,
  },
  saveRegion: mocks.saveRegion,
  saving: false,
};

vi.mock("@plone/volto/registry", () => ({
  default: { blocks: { blocksConfig: {} } },
}));

vi.mock("@plone/volto/components/manage/Form", () => ({
  BlocksForm: (props) => (
    <div>
      <span data-testid="main-form">{String(props.isMainForm)}</span>
      <span data-testid="draft-count">
        {props.properties.blocks_layout.items.length}
      </span>
      <span data-testid="allowed">{JSON.stringify(props.allowedBlocks)}</span>
      <button
        type="button"
        onClick={() =>
          props.onChangeFormData({
            blocks: {
              slate: { "@type": "slate" },
              image: { "@type": "image" },
            },
            blocks_layout: { items: ["slate", "image"] },
          })
        }
      >
        change draft
      </button>
    </div>
  ),
}));

vi.mock("@plone/volto/components/manage/Blocks/Block/EditBlockWrapper", () => ({
  default: ({ children }) => children,
}));

vi.mock("@plone/volto/components/manage/Sidebar/SidebarPortal", () => ({
  default: () => null,
}));

vi.mock("@plone/volto/helpers/Blocks/Blocks", () => ({
  addBlock: (draft, type) => [
    "new-block",
    {
      ...draft,
      blocks: {
        ...draft.blocks,
        "new-block": { "@type": type },
      },
      blocks_layout: {
        items: [...draft.blocks_layout.items, "new-block"],
      },
    },
  ],
}));

vi.mock("../src/context/GlobalRegionsContext", () => ({
  useGlobalRegions: () => mocks.context,
}));

import GlobalBlocksRegionEdit from "../src/components/GlobalBlocksRegionEdit";

describe("GlobalBlocksRegionEdit", () => {
  const originalContext = mocks.context;

  beforeEach(() => {
    mocks.cancelEditing.mockClear();
    mocks.saveRegion.mockClear();
    mocks.context = originalContext;
  });

  it("uses a constrained draft and saves only on Save", async () => {
    render(<GlobalBlocksRegionEdit name="primary" />);

    expect(screen.getByTestId("main-form").textContent).toBe("false");
    expect(screen.getByTestId("draft-count").textContent).toBe("1");
    expect(screen.getByTestId("allowed").textContent).toBe('["slate"]');
    fireEvent.click(screen.getByRole("button", { name: "change draft" }));
    expect(screen.getByTestId("draft-count").textContent).toBe("1");
    expect(mocks.saveRegion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.saveRegion).toHaveBeenCalledTimes(1));
    expect(mocks.saveRegion).toHaveBeenCalledWith("primary", {
      blocks: { slate: { "@type": "slate" } },
      blocks_layout: { items: ["slate"] },
    });
    expect(mocks.cancelEditing).toHaveBeenCalled();
  });

  it("discards the draft on Cancel", () => {
    render(<GlobalBlocksRegionEdit name="primary" />);
    fireEvent.click(screen.getByRole("button", { name: "change draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.saveRegion).not.toHaveBeenCalled();
    expect(mocks.cancelEditing).toHaveBeenCalled();
  });

  it("keeps an empty draft when the stored region has no blocks", () => {
    mocks.context = {
      ...mocks.context,
      definitions: {
        primary: {
          fieldName: "global_regions",
          allowedBlocks: ["genericBlock"],
          maxLength: 1,
        },
      },
      regions: {
        primary: { blocks: {}, blocks_layout: { items: [] } },
      },
    };

    render(<GlobalBlocksRegionEdit name="primary" />);
    expect(screen.getByTestId("draft-count").textContent).toBe("0");
    expect(screen.getByText("Adicionar bloco")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "genericBlock" }));
    expect(screen.getByTestId("draft-count").textContent).toBe("1");
  });
});

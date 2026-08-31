import { describe, expect, it, vi } from "vitest";

vi.mock("@plone/volto/registry", () => ({
  default: {
    addonReducers: {},
    blocks: { blocksConfig: {} },
    settings: {},
  },
}));
vi.mock("@plone/volto/components/manage/Form", () => ({
  BlocksForm: () => null,
}));
vi.mock("@plone/volto/components/theme/View/RenderBlocks", () => ({
  default: () => null,
}));
vi.mock("@plone/volto/components/manage/Pluggable", () => ({
  Plug: () => null,
}));
vi.mock("@plone/volto/components/manage/Sidebar/SidebarPortal", () => ({
  default: ({ children }) => children,
}));
vi.mock("@plone/volto/helpers/BodyClass/BodyClass", () => ({
  default: () => null,
}));
vi.mock("@plone/volto/components/theme/Icon/Icon", () => ({
  default: () => null,
}));
vi.mock("semantic-ui-react", () => ({
  Button: () => null,
  Tab: Object.assign(() => null, { Pane: () => null }),
}));

import applyConfig, {
  GlobalBlocksRegion,
  GlobalBlocksRegionEdit,
  GlobalBlocksRegionView,
  GlobalRegionsProvider,
  GlobalRegionsSidebar,
  GlobalRegionsToolbarPlug,
  RegionBlockSidebarPortal,
  addonReducers,
  bootstrap,
  configureGlobalRegions,
  create,
  fetchGlobalRegions,
  globalRegions,
  normalize,
  resolve,
  saveGlobalRegion,
  saveGlobalRegions,
} from "../src";

describe("public API", () => {
  it("exports configuration, data, context and UI APIs", () => {
    [
      applyConfig,
      configureGlobalRegions,
      bootstrap,
      fetchGlobalRegions,
      saveGlobalRegion,
      saveGlobalRegions,
      globalRegions,
      create,
      normalize,
      resolve,
      GlobalRegionsProvider,
      GlobalBlocksRegion,
      GlobalBlocksRegionView,
      GlobalBlocksRegionEdit,
      GlobalRegionsSidebar,
      GlobalRegionsToolbarPlug,
      RegionBlockSidebarPortal,
    ].forEach((exported) => expect(exported).toBeTypeOf("function"));
    expect(addonReducers).toEqual({ globalRegions });
  });
});

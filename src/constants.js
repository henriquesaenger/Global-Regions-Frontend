export const FETCH_GLOBAL_REGIONS = "FETCH_GLOBAL_REGIONS";
export const SAVE_GLOBAL_REGIONS = "SAVE_GLOBAL_REGIONS";

export const DEFAULT_REGION_NAME = "default";

export const REGION_SIDEBAR_PROPERTIES = "global-regions-sidebar-properties";
export const REGION_SIDEBAR_ORDER = "global-regions-sidebar-order";

export const DEFAULT_GLOBAL_REGIONS_SETTINGS = {
  fieldName: "global_regions",
  rootPath: "/",
  activeRegion: DEFAULT_REGION_NAME,
  regions: {
    [DEFAULT_REGION_NAME]: {
      fieldName: "global_regions",
      title: "Global region",
      allowedBlocks: null,
      maxLength: null,
    },
  },
};

import {
  DEFAULT_GLOBAL_REGIONS_SETTINGS,
  DEFAULT_REGION_NAME,
} from "../constants";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const createGlobalRegion = (initial = {}) => ({
  ...(isObject(initial) ? initial : {}),
  blocks: isObject(initial?.blocks) ? { ...initial.blocks } : {},
  blocks_layout: {
    ...(isObject(initial?.blocks_layout) ? initial.blocks_layout : {}),
    items: Array.isArray(initial.blocks_layout?.items)
      ? [...initial.blocks_layout.items]
      : [],
  },
});

export const normalizeRegionDefinitions = (definitions) => {
  if (Array.isArray(definitions)) {
    return definitions.reduce((result, definition) => {
      const item =
        typeof definition === "string" ? { name: definition } : definition;
      if (item?.name) {
        const { name, ...options } = item;
        result[name] = options;
      }
      return result;
    }, {});
  }

  if (isObject(definitions)) {
    return Object.entries(definitions).reduce((result, [name, options]) => {
      result[name] = isObject(options) ? options : {};
      return result;
    }, {});
  }

  return {};
};

export const getGlobalRegionsSettings = (settings = {}) => {
  const configured = settings.globalRegions || settings;
  const regions = normalizeRegionDefinitions(configured.regions);
  const requestedRegions = Object.keys(regions).length
    ? regions
    : DEFAULT_GLOBAL_REGIONS_SETTINGS.regions;
  const normalizedRegions = Object.entries(requestedRegions).reduce(
    (result, [name, definition]) => {
      result[name] = {
        ...definition,
        fieldName:
          definition.fieldName ||
          configured.fieldName ||
          DEFAULT_GLOBAL_REGIONS_SETTINGS.fieldName,
      };
      return result;
    },
    {},
  );
  const requestedActiveRegion = configured.activeRegion;

  return {
    ...DEFAULT_GLOBAL_REGIONS_SETTINGS,
    ...configured,
    regions: normalizedRegions,
    activeRegion:
      requestedActiveRegion && normalizedRegions[requestedActiveRegion]
        ? requestedActiveRegion
        : Object.keys(normalizedRegions)[0] || DEFAULT_REGION_NAME,
  };
};

export const normalizeGlobalRegion = (region, definition = {}) => {
  if (region === null || region === undefined) return region;
  const created = createGlobalRegion(region);
  const allowedBlocks = definition.allowedBlocks;
  const maxLength = definition.maxLength;
  const validItems = created.blocks_layout.items.filter((id) => {
    const block = created.blocks[id];
    return (
      block &&
      (!Array.isArray(allowedBlocks) || allowedBlocks.includes(block["@type"]))
    );
  });
  const limitedItems =
    Number.isInteger(maxLength) && maxLength >= 0
      ? validItems.slice(0, maxLength)
      : validItems;

  return {
    ...created,
    blocks: limitedItems.reduce((blocks, id) => {
      blocks[id] = created.blocks[id];
      return blocks;
    }, {}),
    blocks_layout: {
      ...created.blocks_layout,
      items: limitedItems,
    },
  };
};

export const normalizeGlobalRegions = (value, definitions) => {
  const stored = isObject(value) ? value : {};
  const configured = normalizeRegionDefinitions(definitions);
  return Object.keys(stored).reduce((regions, name) => {
    regions[name] = normalizeGlobalRegion(stored[name], configured[name]);
    return regions;
  }, {});
};

export const extractGlobalRegions = (representation, definitions) => {
  if (!isObject(representation)) return {};

  const configured = normalizeRegionDefinitions(definitions);
  const configuredFieldName =
    Object.values(configured)[0]?.fieldName ||
    DEFAULT_GLOBAL_REGIONS_SETTINGS.fieldName;
  const stored = representation[configuredFieldName];

  return normalizeGlobalRegions(stored, configured);
};

export const resolveGlobalRegionName = (
  regions,
  requestedName,
  definitions,
) => {
  const configuredNames = Object.keys(normalizeRegionDefinitions(definitions));
  const storedNames = isObject(regions) ? Object.keys(regions) : [];
  const knownNames = [...new Set([...configuredNames, ...storedNames])];
  if (requestedName && knownNames.includes(requestedName)) return requestedName;

  return configuredNames[0] || storedNames[0] || DEFAULT_REGION_NAME;
};

export const resolveGlobalRegion = (regions, requestedName, definitions) => {
  const name = resolveGlobalRegionName(regions, requestedName, definitions);
  if (
    !isObject(regions) ||
    !Object.prototype.hasOwnProperty.call(regions, name)
  ) {
    return undefined;
  }
  return normalizeGlobalRegion(
    regions[name],
    normalizeRegionDefinitions(definitions)[name],
  );
};

export const isEmptyGlobalRegion = (region) =>
  region === null ||
  region === undefined ||
  !Array.isArray(region.blocks_layout?.items) ||
  region.blocks_layout.items.length === 0;

export const createRegionFromDefinition = (definition = {}, context = {}) => {
  const initial =
    typeof definition.createDefault === "function"
      ? definition.createDefault(context)
      : definition.initialRegion;
  return normalizeGlobalRegion(
    initial === null || initial === undefined ? createGlobalRegion() : initial,
    definition,
  );
};

export const extractETag = (representation, getETag) => {
  if (typeof getETag === "function") return getETag(representation) || null;
  return (
    representation?.["@etag"] ||
    representation?.etag ||
    representation?._etag ||
    null
  );
};

export const normalize = normalizeGlobalRegions;
export const create = createGlobalRegion;
export const resolve = resolveGlobalRegion;

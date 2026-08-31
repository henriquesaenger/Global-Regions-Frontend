import config from "@plone/volto/registry";
import { FETCH_GLOBAL_REGIONS, SAVE_GLOBAL_REGIONS } from "../constants";
import {
  getGlobalRegionsSettings,
  normalizeGlobalRegion,
  normalizeGlobalRegions,
} from "../helpers/globalRegions";

const getOptions = (options = {}) => {
  const configured = getGlobalRegionsSettings(config.settings || {});
  return {
    ...configured,
    ...options,
    regions: options.definitions || options.regions || configured.regions,
  };
};

export const fetchGlobalRegions = (options = {}) => {
  const settings = getOptions(options);
  return {
    type: FETCH_GLOBAL_REGIONS,
    definitions: settings.regions,
    getETag: settings.getETag,
    request: {
      op: "get",
      path: settings.fetchPath || settings.rootPath,
    },
  };
};

export const saveGlobalRegion = (name, region, options = {}) => {
  const settings = getOptions(options);
  const definition = settings.regions[name];
  if (!definition) {
    throw new Error(`Unknown global region "${name}"`);
  }

  const fieldName = definition.fieldName;
  const normalized = normalizeGlobalRegion(region, definition);
  const storedRegions = normalizeGlobalRegions(
    options.storedRegions,
    settings.regions,
  );
  const headers = {
    Prefer: "return=representation",
    ...(settings.etag ? { "If-Match": settings.etag } : {}),
    ...(settings.headers || {}),
  };

  return {
    type: SAVE_GLOBAL_REGIONS,
    fieldName,
    regionName: name,
    definitions: settings.regions,
    getETag: settings.getETag,
    region: normalized,
    etag: settings.etag || null,
    request: {
      op: "patch",
      path: settings.savePath || settings.rootPath,
      data: {
        [fieldName]: {
          ...storedRegions,
          [name]: normalized,
        },
      },
      headers,
    },
  };
};

export const saveGlobalRegions = (regions, options = {}) => {
  const names = options.regionName
    ? [options.regionName]
    : Object.keys(regions || {});
  if (names.length !== 1) {
    throw new Error(
      "saveGlobalRegions compatibility wrapper accepts exactly one region",
    );
  }
  const name = names[0];
  return saveGlobalRegion(name, regions?.[name], {
    ...options,
    storedRegions: options.storedRegions || regions,
  });
};

export const bootstrapGlobalRegions = (store, options = {}) => {
  const state = store.getState().globalRegions;
  if (state?.loaded) return Promise.resolve(state.data);
  return store.dispatch(fetchGlobalRegions(options));
};

export const bootstrap = bootstrapGlobalRegions;

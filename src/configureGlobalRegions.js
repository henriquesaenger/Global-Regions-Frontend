import globalRegionsReducer from "./reducers/globalRegions";
import {
  DEFAULT_GLOBAL_REGIONS_SETTINGS,
  DEFAULT_REGION_NAME,
} from "./constants";
import {
  getGlobalRegionsSettings,
  normalizeRegionDefinitions,
} from "./helpers/globalRegions";

export const configureGlobalRegions = (config, options = {}) => {
  const previous = config.settings.globalRegions || {};
  const requestedDefinitions =
    options.regions === undefined ? previous.regions : options.regions;
  const definitions = normalizeRegionDefinitions(requestedDefinitions);
  const regions = Object.keys(definitions).length
    ? definitions
    : DEFAULT_GLOBAL_REGIONS_SETTINGS.regions;
  const activeRegion =
    options.activeRegion || previous.activeRegion || Object.keys(regions)[0];

  config.settings.globalRegions = getGlobalRegionsSettings({
    ...previous,
    ...options,
    regions,
    activeRegion: regions[activeRegion]
      ? activeRegion
      : Object.keys(regions)[0] || DEFAULT_REGION_NAME,
  });
  config.addonReducers = {
    ...config.addonReducers,
    globalRegions: globalRegionsReducer,
  };

  return config;
};

export const applyConfig = (config) => configureGlobalRegions(config);

export default applyConfig;

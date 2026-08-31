import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import config from "@plone/volto/registry";
import BodyClass from "@plone/volto/helpers/BodyClass/BodyClass";
import { fetchGlobalRegions, saveGlobalRegion } from "../actions/globalRegions";
import {
  getGlobalRegionsSettings,
  normalizeGlobalRegions,
  normalizeRegionDefinitions,
  resolveGlobalRegion,
  resolveGlobalRegionName,
} from "../helpers/globalRegions";

export const GlobalRegionsContext = createContext(null);
const EMPTY_OPTIONS = {};
const EMPTY_STATE = {};

export const GlobalRegionsProvider = ({
  children,
  activeRegion: requestedActiveRegion,
  autoFetch = true,
  options = EMPTY_OPTIONS,
}) => {
  const dispatch = useDispatch();
  const state = useSelector(
    (reduxState) => reduxState.globalRegions || EMPTY_STATE,
  );
  const settings = useMemo(
    () =>
      getGlobalRegionsSettings({
        ...config.settings?.globalRegions,
        ...options,
      }),
    [options],
  );
  const definitions = useMemo(
    () => normalizeRegionDefinitions(settings.regions),
    [settings.regions],
  );
  const regions = useMemo(
    () => normalizeGlobalRegions(state.data, definitions),
    [state.data, definitions],
  );
  const [selectedRegion, setSelectedRegion] = useState(
    requestedActiveRegion || settings.activeRegion,
  );
  const [editingRegion, setEditingRegion] = useState(null);
  const activeRegionName = resolveGlobalRegionName(
    regions,
    requestedActiveRegion || selectedRegion,
    definitions,
  );
  const activeRegion = resolveGlobalRegion(
    regions,
    activeRegionName,
    definitions,
  );

  useEffect(() => {
    if (autoFetch && !state.loaded && !state.loading) {
      dispatch(fetchGlobalRegions(settings));
    }
  }, [autoFetch, dispatch, settings.rootPath, state.loaded, state.loading]);

  const setActiveRegion = useCallback(
    (name) => {
      setSelectedRegion(resolveGlobalRegionName(regions, name, definitions));
    },
    [definitions, regions],
  );

  const saveRegion = useCallback(
    (name, region, saveOptions = {}) => {
      const resolvedName = resolveGlobalRegionName(regions, name, definitions);
      return dispatch(
        saveGlobalRegion(resolvedName, region, {
          ...settings,
          ...saveOptions,
          etag: saveOptions.etag ?? state.etag,
          storedRegions: saveOptions.storedRegions || regions,
        }),
      );
    },
    [definitions, dispatch, regions, settings, state.etag],
  );

  const value = useMemo(
    () => ({
      activeRegion,
      activeRegionName,
      beginEditing: (name = activeRegionName) =>
        setEditingRegion(resolveGlobalRegionName(regions, name, definitions)),
      canEdit: Boolean(state.canEdit),
      cancelEditing: () => setEditingRegion(null),
      definitions,
      editingRegion,
      error: state.error || null,
      etag: state.etag || null,
      fetch: (fetchOptions = {}) =>
        dispatch(fetchGlobalRegions({ ...settings, ...fetchOptions })),
      loaded: Boolean(state.loaded),
      loading: Boolean(state.loading),
      regions,
      save: saveRegion,
      saveRegion,
      saving: Boolean(state.saving),
      setActiveRegion,
      settings,
    }),
    [
      activeRegion,
      activeRegionName,
      definitions,
      dispatch,
      editingRegion,
      regions,
      saveRegion,
      setActiveRegion,
      settings,
      state.error,
      state.canEdit,
      state.etag,
      state.loaded,
      state.loading,
      state.saving,
    ],
  );

  return (
    <GlobalRegionsContext.Provider value={value}>
      {editingRegion && (
        <BodyClass
          className={`global-region-editing global-region-editing-${editingRegion}`}
        />
      )}
      {children}
    </GlobalRegionsContext.Provider>
  );
};

export const useGlobalRegions = () => {
  const context = useContext(GlobalRegionsContext);
  if (!context) {
    throw new Error(
      "useGlobalRegions must be used inside GlobalRegionsProvider",
    );
  }
  return context;
};

export const useOptionalGlobalRegions = () => useContext(GlobalRegionsContext);

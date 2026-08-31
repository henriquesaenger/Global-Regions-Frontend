import { FETCH_GLOBAL_REGIONS, SAVE_GLOBAL_REGIONS } from "../constants";
import {
  extractETag,
  extractGlobalRegions,
  normalizeGlobalRegion,
} from "../helpers/globalRegions";

export const initialState = {
  canEdit: false,
  data: {},
  etag: null,
  loaded: false,
  loading: false,
  saving: false,
  error: null,
};

export default function globalRegions(state = initialState, action = {}) {
  switch (action.type) {
    case `${FETCH_GLOBAL_REGIONS}_PENDING`:
      return { ...state, loading: true, error: null };

    case `${FETCH_GLOBAL_REGIONS}_SUCCESS`:
      return {
        ...state,
        canEdit: Boolean(
          action.result?.["@components"]?.actions?.object?.some(
            (item) => item.id === "edit",
          ),
        ),
        data: extractGlobalRegions(action.result, action.definitions),
        etag: extractETag(action.result, action.getETag),
        loaded: true,
        loading: false,
        error: null,
      };

    case `${FETCH_GLOBAL_REGIONS}_FAIL`:
      return {
        ...state,
        loaded: false,
        loading: false,
        error: action.error,
      };

    case `${SAVE_GLOBAL_REGIONS}_PENDING`:
      return { ...state, saving: true, error: null };

    case `${SAVE_GLOBAL_REGIONS}_SUCCESS`: {
      const definition = action.definitions?.[action.regionName] || {};
      const responseHasCollection =
        action.result &&
        Object.prototype.hasOwnProperty.call(action.result, action.fieldName);
      const responseRegions = responseHasCollection
        ? extractGlobalRegions(action.result, action.definitions)
        : {};

      return {
        ...state,
        data: responseHasCollection
          ? { ...state.data, ...responseRegions }
          : {
              ...state.data,
              [action.regionName]: normalizeGlobalRegion(
                action.region,
                definition,
              ),
            },
        etag:
          extractETag(action.result, action.getETag) ||
          action.etag ||
          state.etag,
        loaded: true,
        saving: false,
        error: null,
      };
    }

    case `${SAVE_GLOBAL_REGIONS}_FAIL`:
      return { ...state, saving: false, error: action.error };

    default:
      return state;
  }
}

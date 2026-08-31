import React from "react";
import { useGlobalRegions } from "../context/GlobalRegionsContext";
import {
  resolveGlobalRegion,
  resolveGlobalRegionName,
} from "../helpers/globalRegions";
import GlobalBlocksRegionEdit from "./GlobalBlocksRegionEdit";
import GlobalBlocksRegionView from "./GlobalBlocksRegionView";

const GlobalBlocksRegion = ({
  name,
  fallback = null,
  editProps = {},
  viewProps = {},
  ...rest
}) => {
  const globalRegions = useGlobalRegions();
  const regionName = resolveGlobalRegionName(
    globalRegions.regions,
    name || globalRegions.activeRegionName,
    globalRegions.definitions,
  );
  const region = resolveGlobalRegion(
    globalRegions.regions,
    regionName,
    globalRegions.definitions,
  );

  if (globalRegions.editingRegion === regionName) {
    return (
      <GlobalBlocksRegionEdit name={regionName} {...rest} {...editProps} />
    );
  }

  if (region === null || region === undefined) {
    const resolvedFallback =
      typeof fallback === "function"
        ? fallback({
            definition: globalRegions.definitions[regionName] || {},
            name: regionName,
          })
        : fallback;

    if (
      resolvedFallback === null ||
      resolvedFallback === undefined ||
      React.isValidElement(resolvedFallback) ||
      typeof resolvedFallback !== "object"
    ) {
      return <>{resolvedFallback}</>;
    }

    return (
      <GlobalBlocksRegionView
        name={regionName}
        region={resolvedFallback}
        {...rest}
        {...viewProps}
      />
    );
  }

  return (
    <GlobalBlocksRegionView
      name={regionName}
      region={region}
      {...rest}
      {...viewProps}
    />
  );
};

export default GlobalBlocksRegion;

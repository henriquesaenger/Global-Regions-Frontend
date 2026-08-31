import React from "react";
import RenderBlocks from "@plone/volto/components/theme/View/RenderBlocks";
import { createGlobalRegion } from "../helpers/globalRegions";

const GlobalBlocksRegionView = ({
  region,
  name,
  location = { pathname: "" },
  metadata,
  blocksConfig,
  as = "div",
  className,
  ...rest
}) => {
  const content = createGlobalRegion(region);
  const Wrapper = as;

  return (
    <Wrapper
      className={
        className || `global-blocks-region global-blocks-region-${name}`
      }
      data-global-region={name}
    >
      <RenderBlocks
        {...rest}
        content={content}
        metadata={metadata || content}
        location={location}
        blocksConfig={blocksConfig}
        isContainer
      />
    </Wrapper>
  );
};

export default GlobalBlocksRegionView;

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider as ReduxProvider } from "react-redux";
import { combineReducers, createStore } from "redux";
import { describe, expect, it, vi } from "vitest";

vi.mock("@plone/volto/registry", () => ({
  default: {
    settings: {
      globalRegions: {
        activeRegion: "missing",
        regions: {
          primary: { fieldName: "global_regions" },
          secondary: { fieldName: "global_regions" },
        },
      },
    },
  },
}));

import globalRegions from "../src/reducers/globalRegions";
import {
  GlobalRegionsProvider,
  useGlobalRegions,
} from "../src/context/GlobalRegionsContext";

const Probe = () => {
  const context = useGlobalRegions();
  return (
    <>
      <span data-testid="active">{context.activeRegionName}</span>
      <span data-testid="value">{String(context.activeRegion)}</span>
      <button
        type="button"
        onClick={() => context.setActiveRegion("secondary")}
      >
        secondary
      </button>
    </>
  );
};

describe("GlobalRegionsProvider", () => {
  it("always exposes a valid active region", () => {
    const store = createStore(combineReducers({ globalRegions }));
    render(
      <ReduxProvider store={store}>
        <GlobalRegionsProvider autoFetch={false}>
          <Probe />
        </GlobalRegionsProvider>
      </ReduxProvider>,
    );

    expect(screen.getByTestId("active").textContent).toBe("primary");
    expect(screen.getByTestId("value").textContent).toBe("undefined");
    fireEvent.click(screen.getByRole("button", { name: "secondary" }));
    expect(screen.getByTestId("active").textContent).toBe("secondary");
  });
});

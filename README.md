# Global Regions Frontend

Reusable Volto infrastructure for editing and rendering named Global Regions.

This add-on is intentionally theme-agnostic. It provides configuration,
persistence helpers, React context, and Volto block editing components. The
integrating project decides which regions exist, where they appear, which
blocks they allow, and how they are styled.

Global Regions are stored in the Plone Site root by the companion backend
add-on as a single `global_regions` collection. A project may use names such
as `site-navigation`, `campaign-banner`, or `campaign-sidebar`. Names are
not prescribed by this package.

## Features

- Configurable named regions with titles, descriptions, allowed blocks, and
  optional block limits
- One shared backend field by default: `global_regions`
- Redux reducer and actions for fetching and saving regions through the
  standard Plone REST API
- `GlobalRegionsProvider` React context with loading, saving, editing, ETag,
  and error state
- `GlobalBlocksRegion` components that render Volto blocks in view or edit
  mode
- Native Volto block form, sidebar, ordering, save, and cancel integration
- Safe region-save behavior: the client merges the saved region with the
  currently stored collection before sending `PATCH`
- Helpers to normalize region definitions and Volto block layouts

## Compatibility

| Component | Version |
| --- | --- |
| Volto | 18.23+ |
| React | 18 |
| React Redux | 8 |
| Backend | Global Regions Backend for Plone 6.1 |

## Installation

Install the package in the Volto project:

```shell
pnpm add volto-global-regions
```

For a local checkout in a Volto monorepo, add it as a workspace package using
the project package manager, then ensure its dependencies are installed.

The package has peer dependencies on `@plone/volto`, `react`,
`react-dom`, and `react-redux`; the consuming Volto project supplies them.

This add-on requires the [Global Regions Backend](https://github.com/henriquesaenger/Global-Regions-Backend) add-on to be installed on the Plone Site. The backend exposes the `global_regions` field through the standard Plone REST API.

## Configure Volto

Apply the add-on configuration in the Volto configuration pipeline:

```js
import { configureGlobalRegions } from "volto-global-regions";

export default function applyConfig(config) {
  return configureGlobalRegions(config, {
    rootPath: "/",
    activeRegion: "site-navigation",
    regions: {
      "site-navigation": {
        title: "Site navigation",
        description: "Shared navigation content.",
        allowedBlocks: ["navigation", "text"],
        maxLength: 2,
      },
      "campaign-banner": {
        title: "Campaign banner",
        allowedBlocks: ["image", "slate"],
        maxLength: 1,
      },
    },
  });
}
```

Calling `configureGlobalRegions`:

- stores the definitions in `config.settings.globalRegions`
- registers the `globalRegions` Redux reducer
- selects a valid active region

When no regions are configured, the add-on defines one region named
`default`.

## Region definitions

The `regions` option accepts either an object or an array.

Object form:

```js
regions: {
  "site-navigation": {
    title: "Site navigation",
    description: "Shared navigation content.",
    allowedBlocks: ["navigation", "text"],
    maxLength: 2,
  },
}
```

Array form:

```js
regions: [
  "site-navigation",
  {
    name: "campaign-banner",
    title: "Campaign banner",
    allowedBlocks: ["image"],
    maxLength: 1,
  },
]
```

Supported definition options include:

| Option | Purpose |
| --- | --- |
| `title` | Label shown by the editing interface |
| `description` | Text shown while editing |
| `allowedBlocks` | Array of permitted Volto block types; omit for no add-on-level restriction |
| `maxLength` | Maximum number of permitted blocks; omit for no limit |
| `initialRegion` | Initial Volto block document for an empty region |
| `createDefault` | Function that returns an initial region dynamically |
| `blocksConfig` | Block configuration override passed to Volto's block form |
| `fieldName` | REST field name; defaults to `global_regions` |

All named regions should use the same `fieldName` when they are persisted by
the Global Regions Backend. The default is already correct.

## Render a region

Wrap the theme or application layout with `GlobalRegionsProvider`, then
render a region where the theme needs it:

```jsx
import {
  GlobalBlocksRegion,
  GlobalRegionsProvider,
} from "volto-global-regions";

export function Layout() {
  return (
    <GlobalRegionsProvider>
      <GlobalBlocksRegion name="site-navigation" />
      <main>{/* page content */}</main>
      <GlobalBlocksRegion name="campaign-banner" />
    </GlobalRegionsProvider>
  );
}
```

`GlobalBlocksRegion` automatically selects the configured region and renders
its normal view. When that region enters edit mode, it renders the Volto block
editor instead.

A fallback may be supplied while a region has no saved value:

```jsx
<GlobalBlocksRegion
  name="campaign-banner"
  fallback={{
    blocks: {},
    blocks_layout: { items: [] },
  }}
/>
```

The fallback may also be a React node or a function that receives the resolved
region name and definition.

## Edit a region

Use the context to begin or cancel editing:

```jsx
import { useGlobalRegions } from "volto-global-regions";

function EditRegionButton() {
  const { beginEditing, cancelEditing, editingRegion } = useGlobalRegions();

  return (
    <button
      onClick={() =>
        editingRegion ? cancelEditing() : beginEditing("site-navigation")
      }
    >
      Edit shared navigation
    </button>
  );
}
```

During editing, `GlobalBlocksRegionEdit` integrates save and cancel controls
with Volto's main toolbar. Saving:

1. normalizes the draft according to the region definition;
2. merges it with the current collection of stored regions;
3. sends a `PATCH` to the site root with
   `Prefer: return=representation`;
4. preserves the ETag when one was returned by the server; and
5. leaves edit mode after a successful save.

## Backend contract

The add-on fetches the site root with `GET /` by default and expects a
response like:

```json
{
  "@etag": "…",
  "global_regions": {
    "site-navigation": {
      "blocks": {
        "navigation": {
          "@type": "navigation"
        }
      },
      "blocks_layout": {
        "items": ["navigation"]
      }
    }
  }
}
```

When saving `site-navigation`, the add-on sends the entire merged collection:

```json
{
  "global_regions": {
    "site-navigation": {
      "blocks": {
        "navigation": {
          "@type": "navigation"
        }
      },
      "blocks_layout": {
        "items": ["navigation"]
      }
    }
  }
}
```

This matches the Global Regions Backend data model. The backend persists and
validates the collection, while the frontend applies editing rules and
preserves sibling regions during a single-region save.

Change `rootPath`, `fetchPath`, `savePath`, `headers`, or `getETag` in
the configuration only when the integrating project requires a different API
location or request behavior.

## Public API

The package exports:

| Area | Main exports |
| --- | --- |
| Configuration | `applyConfig`, `configureGlobalRegions` |
| Components | `GlobalBlocksRegion`, `GlobalBlocksRegionEdit`, `GlobalBlocksRegionView`, `GlobalRegionsSidebar`, `GlobalRegionsToolbarPlug` |
| Context | `GlobalRegionsProvider`, `useGlobalRegions`, `useOptionalGlobalRegions` |
| Actions | `fetchGlobalRegions`, `saveGlobalRegion`, `bootstrapGlobalRegions` |
| Helpers | `createGlobalRegion`, `normalizeGlobalRegion`, `resolveGlobalRegion`, `extractGlobalRegions` |
| Redux | `addonReducers`, `globalRegions`, `globalRegionsInitialState` |

## Responsibilities

| Layer | Responsibility |
| --- | --- |
| Global Regions Backend | Persistence, schema validation, and REST API transformations |
| Global Regions Frontend | Configuration, fetch/save flow, context, and block editing |
| Theme or project | Region names, placement, allowed block choices, and styling |

The add-on deliberately does not render a fixed site structure or introduce
special-purpose regions. A project can use it for any reusable block area.

## Tests

```shell
pnpm test
```

The test suite uses Vitest and covers configuration, helpers, actions, Redux,
context, rendering, editing behavior, and public exports.

## License

MIT. See [LICENSE](LICENSE).


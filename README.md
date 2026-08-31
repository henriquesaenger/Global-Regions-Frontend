# Global Regions Frontend

Reusable Volto infrastructure for named Global Regions.

The add-on persists all regions in one backend field, `global_regions`.
Projects configure the names, labels, allowed blocks, and render locations.
For example, a project may configure `site-navigation`, `home-banner`, or
`campaign-sidebar`; none is imposed by the addon.

Each configured region is rendered with `GlobalBlocksRegion` inside a
`GlobalRegionsProvider`. Region placement is defined by the consuming theme, not by this addon.
